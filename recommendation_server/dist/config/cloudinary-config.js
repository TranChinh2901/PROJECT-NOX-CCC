"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const load_env_1 = require("./load-env");
cloudinary_1.v2.config({
    cloud_name: load_env_1.loadedEnv.cloudinary.name,
    api_key: load_env_1.loadedEnv.cloudinary.key,
    api_secret: load_env_1.loadedEnv.cloudinary.secret,
});
exports.default = cloudinary_1.v2;
