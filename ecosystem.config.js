module.exports = {
    apps: [{
        name: "P3020-loza-rufeil-prod",
        script: "dist/api/index.js",
        env: {
            "PORT": 3020
        },
    }]
}