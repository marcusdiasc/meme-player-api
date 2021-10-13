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
exports.MemeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const fs_1 = require("fs");
const get_user_decorator_1 = require("../auth/decorator/get-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_schema_1 = require("../user/schema/user.schema");
const meme_service_1 = require("./meme.service");
let MemeController = class MemeController {
    constructor(memeService) {
        this.memeService = memeService;
    }
    async getMemes(search, order, page) {
        return await this.memeService.getMemes(search, order, page);
    }
    async postMeme(user, title, file) {
        return await this.memeService.createMeme(user, title, file);
    }
    async deleteMeme(user, memeId) {
        return await this.memeService.deleteMeme(user, memeId);
    }
    async downloadMeme(res, memeId) {
        const { path, filename } = await this.memeService.downloadMeme(memeId);
        const file = (0, fs_1.createReadStream)('./public' + path);
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${filename}.mp3"`,
        });
        file.pipe(res);
    }
    async likeMeme(user, memeId) {
        return await this.memeService.likeMeme(user, memeId);
    }
    async unlikeMeme(user, memeId) {
        return await this.memeService.unlikeMeme(user, memeId);
    }
    async addFav(user, memeId) {
        return await this.memeService.addFav(user, memeId);
    }
};
__decorate([
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('order')),
    __param(2, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "getMemes", null);
__decorate([
    (0, common_1.Post)('/'),
    (0, common_1.HttpCode)(201),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "postMeme", null);
__decorate([
    (0, common_1.Delete)('/'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)('memeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "deleteMeme", null);
__decorate([
    (0, common_1.Get)('/download/:memeId'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Param)('memeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "downloadMeme", null);
__decorate([
    (0, common_1.Patch)('/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)('memeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "likeMeme", null);
__decorate([
    (0, common_1.Patch)('/unlike'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)('memeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "unlikeMeme", null);
__decorate([
    (0, common_1.Patch)('/fav'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)('memeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MemeController.prototype, "addFav", null);
MemeController = __decorate([
    (0, common_1.Controller)('meme'),
    __metadata("design:paramtypes", [meme_service_1.MemeService])
], MemeController);
exports.MemeController = MemeController;
//# sourceMappingURL=meme.controller.js.map