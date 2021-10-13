"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemeService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const meme_schema_1 = require("./schema/meme.schema");
const user_schema_1 = require("../user/schema/user.schema");
const getMP3Duration = require("get-mp3-duration");
const config_1 = require("@nestjs/config");
const error_code_enum_1 = require("../enum/error-code.enum");
const url_slug_1 = require("url-slug");
const aws_sdk_1 = require("aws-sdk");
let MemeService = class MemeService {
    constructor(configService, memeModel, userModel) {
        this.configService = configService;
        this.memeModel = memeModel;
        this.userModel = userModel;
    }
    async getMemes(search, order, page) {
        let memes = [];
        const itemsPerPage = 2;
        const currPage = page ? page : 0;
        let pageCount = 1;
        if (search) {
            const decodedSearch = decodeURI(search);
            pageCount = await this.memeModel
                .find({
                title: new RegExp(decodedSearch, 'i'),
            })
                .populate('userId', '_id username')
                .count();
            memes = await this.memeModel
                .find({
                title: new RegExp(decodedSearch, 'i'),
            })
                .populate('userId', '_id username')
                .limit(itemsPerPage)
                .skip(itemsPerPage * currPage);
        }
        else if (order === 'new') {
            pageCount = await this.memeModel
                .find()
                .populate('userId', '_id username')
                .sort({ createdAt: -1 })
                .count();
            memes = await this.memeModel
                .find()
                .populate('userId', '_id username')
                .sort({ createdAt: -1 })
                .limit(itemsPerPage)
                .skip(itemsPerPage * currPage);
        }
        else if (order === 'trending') {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            pageCount = await this.memeModel
                .find({ createdAt: { $gte: date } })
                .populate('userId', '_id username')
                .sort({ points: -1 })
                .count();
            memes = await this.memeModel
                .find({ createdAt: { $gte: date } })
                .populate('userId', '_id username')
                .sort({ points: -1 })
                .limit(itemsPerPage)
                .skip(itemsPerPage * currPage);
        }
        else {
            pageCount = await this.memeModel
                .find()
                .populate('userId', '_id username')
                .sort({ points: -1 })
                .count();
            memes = await this.memeModel
                .find()
                .populate('userId', '_id username')
                .sort({ points: -1 })
                .limit(itemsPerPage)
                .skip(itemsPerPage * currPage);
        }
        return {
            memes: memes,
            page: currPage,
            pages: Math.ceil(pageCount / itemsPerPage),
        };
    }
    async createMeme(user, title, file) {
        const isValidTitle = this.isValidTitle(title);
        if (!isValidTitle) {
            throw new common_1.BadRequestException({
                erroCode: error_code_enum_1.ErrorCode.EMPTY_TITLE,
                message: 'title is required',
                field: 'title',
            });
        }
        const isValidExtension = this.isExtensionValid(file);
        if (!isValidExtension) {
            throw new common_1.BadRequestException({
                erroCode: error_code_enum_1.ErrorCode.INVALID_FILE_EXTENSION,
                message: 'the meme must be a mp3',
                field: 'file',
            });
        }
        const isValidDuration = await this.isDurationValid(file.buffer);
        if (!isValidDuration) {
            throw new common_1.BadRequestException({
                erroCode: error_code_enum_1.ErrorCode.INVALID_FILE_DURATION,
                message: 'The file must be at most 20 seconds long.',
                field: 'file',
            });
        }
        const slug = (0, url_slug_1.convert)(title);
        const userMemes = (await user.populate('uploadedMemes')).uploadedMemes;
        const isAlreadyCreated = userMemes.find((m) => m.slug === slug);
        if (isAlreadyCreated) {
            throw new common_1.BadRequestException({
                erroCode: error_code_enum_1.ErrorCode.ALREADY_CREATED,
                message: 'meme already created',
                field: 'title',
            });
        }
        let meme;
        try {
            meme = new this.memeModel({ title, userId: user, slug });
            await meme.save();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        let uploadResult;
        try {
            const s3 = new aws_sdk_1.S3();
            uploadResult = await s3
                .upload({
                Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
                Body: file.buffer,
                Key: `sounds/${user.username}/${slug}.mp3`,
            })
                .promise();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        console.log(uploadResult);
        meme.memeUrl = `https://sounds.memeplayer.net/${uploadResult.Key}`;
        meme.awsKey = uploadResult.Key;
        await meme.save();
        user.uploadedMemes.push(meme);
        await user.save();
        return meme.populate('userId', '_id username');
    }
    async deleteMeme(user, memeId) {
        const meme = await this.memeModel.findById(memeId);
        if (!meme) {
            throw new common_1.NotFoundException({
                errorCode: error_code_enum_1.ErrorCode.MEME_DOENST_EXISTS,
            });
        }
        if (meme.userId.toString() !== user._id.toString()) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.ACTION_NOT_ALLOWED,
            });
        }
        const s3 = new aws_sdk_1.S3();
        await s3
            .deleteObject({
            Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
            Key: meme.awsKey,
        })
            .promise();
        user.uploadedMemes = user.uploadedMemes.filter((m) => m._id.toString() !== memeId);
        await this.userModel.updateMany({ likes: meme._id }, {
            $pull: { likes: meme._id },
        }, { multi: true });
        await this.userModel.updateMany({ unlikes: meme._id }, {
            $pull: { unlikes: meme._id },
        }, { multi: true });
        await this.userModel.updateMany({ favourites: meme._id }, {
            $pull: { favourites: meme._id },
        }, { multi: true });
        await meme.delete();
        await user.save();
        return {
            _id: meme._id.toString(),
        };
    }
    async downloadMeme(memeId) {
        const meme = await this.memeModel.findById(memeId);
        return {
            path: 'teste',
            filename: meme.slug,
        };
    }
    async likeMeme(user, memeId) {
        let meme;
        try {
            meme = await this.memeModel.findById(memeId);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        if (!meme) {
            throw new common_1.InternalServerErrorException({
                errorCode: error_code_enum_1.ErrorCode.MEME_DOENST_EXISTS,
            });
        }
        const memesLiked = user.likes;
        const isAlreadyLiked = memesLiked.find((mm) => {
            return mm._id.toString() === meme._id.toString();
        });
        if (isAlreadyLiked) {
            meme.points -= 1;
            user.likes = user.likes.filter((mm) => mm._id.toString() !== memeId.toString());
        }
        else {
            meme.points += 1;
            user.likes.push(meme);
            const memesUnliked = user.unlikes;
            const isMemeUnliked = memesUnliked.find((mm) => mm._id.toString() === meme._id.toString());
            if (isMemeUnliked) {
                meme.points += 1;
                user.unlikes = memesUnliked.filter((mm) => mm._id.toString() !== meme._id.toString());
            }
        }
        await user.save();
        await meme.save();
        return meme.populate('userId', '_id username');
    }
    async unlikeMeme(user, memeId) {
        let meme;
        try {
            meme = await this.memeModel.findById(memeId);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        if (!meme) {
            throw new common_1.InternalServerErrorException({
                errorCode: error_code_enum_1.ErrorCode.MEME_DOENST_EXISTS,
            });
        }
        const memesUnliked = user.unlikes;
        const isAlreadyUnliked = memesUnliked.find((mm) => mm._id.toString() === meme._id.toString());
        if (isAlreadyUnliked) {
            meme.points += 1;
            user.unlikes = user.unlikes.filter((mm) => mm._id.toString() !== memeId.toString());
        }
        else {
            meme.points -= 1;
            user.unlikes.push(meme);
            const memesLiked = user.likes;
            const isMemeLiked = memesLiked.find((mm) => mm._id.toString() === meme._id.toString());
            if (isMemeLiked) {
                meme.points -= 1;
                user.likes = memesLiked.filter((mm) => mm._id.toString() !== meme._id.toString());
            }
        }
        await user.save();
        await meme.save();
        return meme.populate('userId', '_id username');
    }
    async addFav(user, memeId) {
        let meme;
        try {
            meme = await this.memeModel.findById(memeId);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        if (!meme) {
            throw new common_1.InternalServerErrorException({
                errorCode: error_code_enum_1.ErrorCode.MEME_DOENST_EXISTS,
            });
        }
        const isAlreadyFav = user.favourites.find((m) => m._id.toString() === memeId);
        if (isAlreadyFav) {
            user.favourites = user.favourites.filter((m) => m._id.toString() !== memeId);
        }
        else {
            user.favourites.push(meme);
        }
        await user.save();
        return { _id: meme._id.toString() };
    }
    isValidTitle(title) {
        return title.trim() !== '';
    }
    async isDurationValid(buffer) {
        const maxDuration = +this.configService.get('FILE_MAX_DURATION');
        const duration = await getMP3Duration(buffer);
        console.log(duration);
        if (duration > maxDuration) {
            return false;
        }
        return true;
    }
    isExtensionValid(file) {
        if (file.mimetype !== 'audio/mpeg') {
            return false;
        }
        const fileExtension = file.originalname.split('.').slice(-1)[0];
        if (fileExtension !== 'mp3') {
            return false;
        }
        return true;
    }
};
MemeService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_2.InjectModel)(meme_schema_1.Meme.name)),
    __param(2, (0, mongoose_2.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_1.Model,
        mongoose_1.Model])
], MemeService);
exports.MemeService = MemeService;
//# sourceMappingURL=meme.service.js.map