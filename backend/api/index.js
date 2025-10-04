"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
async function handler(req, res) {
    // Dynamically import the compiled app
    const { app } = require('../dist/app');
    // Handle the request with Express app
    return new Promise((resolve, reject) => {
        app(req, res);
        res.on('finish', resolve);
        res.on('error', reject);
    });
}
//# sourceMappingURL=index.js.map