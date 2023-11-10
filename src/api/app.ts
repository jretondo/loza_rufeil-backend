import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https'

dotenv.config({
    path: path.join(__dirname, "..", "..", ".env")
});

import { errorThrow } from '../network/errors';

import test from './components/test';
import auth from './components/auth/auth.rtr';
import user from './components/user/user.rtr';
import routes from './components/routes/routes.rtr';
import activity from './components/activity/activity.rtr';
import clients from './components/clients/clients.rtr';
import providers from './components/providers/providers.rtr';
import certificates from './components/certificates/certificates.rtr';
import accounting from './components/accounting/accounting.rtr';
import modules from './components/modules/modules.rtr';
import purchases from './components/purchases/purchases.rtr';
import views from './components/views/network';
import morgan from 'morgan';

import { config } from '../config';
export class App {
    app: Application;
    constructor(
        private port: number | string
    ) {
        this.app = express();
        this.settings();
        this.middleware();
        this.routes();
    }

    private settings() {
        this.app.set('port', this.port);
        this.app.set('views', path.join('views'));
        this.app.set('view engine', 'ejs');
    }

    private middleware() {
        this.app.use(cors({
            exposedHeaders: ['Content-Disposition']
        }));
        this.app.use(express.json());
        this.app.use(morgan('dev'));
        this.app.use(express.urlencoded({ extended: true }));
    }

    private routes() {
        this.app.use("/static", express.static(path.join(__dirname, "..", "..", "public")));
        this.app.use('/api', test);
        this.app.use("/api/auth", auth)
        this.app.use("/api/user", user)
        this.app.use("/api/routes", routes)
        this.app.use("/api/activity", activity)
        this.app.use("/api/views", views)
        this.app.use("/api/clients", clients)
        this.app.use("/api/providers", providers)
        this.app.use("/api/certificates", certificates)
        this.app.use("/api/accounting", accounting)
        this.app.use("/api/purchases", purchases)
        this.app.use("/api/modules", modules)
        this.app.use(errorThrow);
    }

    listenTest(): void {
        this.app.listen(this.app.get('port'));
        console.log(`Conectado al puerto ${this.app.get('port')}`)
    }

    listenProd(): void {
        var options = {
            key: fs.readFileSync(path.join(__dirname, "..", "..", "..", "..", "..", config.ssl.key), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, "..", "..", "..", "..", "..", config.ssl.crt), 'utf8')
        };
        https.createServer(options, this.app).listen(this.app.get('port'), () => {
            console.log(`Conectado al puerto ${this.app.get('port')}`)
        });
    }
}