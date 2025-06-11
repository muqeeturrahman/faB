'use strict';

const AdminAPI = require('./admin');
const AuthAPI = require('./auth');
const OtpAPI = require('./otp');
const sessionAPI=require("./session")
const RootAPI = require('./root');

const UserAPI = require('./user');
const EventAPI = require("./event")
const ServiceAPI = require('./service')
const NotificationAPI=require('./notification')
const ReportAPI = require("./report")
const MessageAPI = require("./message")

const { Router } = require('express');

class API {
    constructor(app) {
        this.app = app;
        this.router = Router();
        this.routeGroups = [];
    }

    loadRouteGroups() {
        this.routeGroups.push(new RootAPI());
        this.routeGroups.push(new AuthAPI());
        this.routeGroups.push(new OtpAPI());
        this.routeGroups.push(new AdminAPI());
        this.routeGroups.push(new UserAPI());
        this.routeGroups.push(new ServiceAPI());
        this.routeGroups.push(new NotificationAPI());
        this.routeGroups.push(new EventAPI());
        this.routeGroups.push(new ReportAPI());
        this.routeGroups.push(new sessionAPI());
        this.routeGroups.push(new MessageAPI());

        

        // this.routeGroups.push(new notificationApi());
        // this.routeGroups.push(new messageApi());
        // this.routeGroups.push(new propertyApi());
        // this.routeGroups.push(new reviewApi());
        // this.routeGroups.push(new requestApi());
        // this.routeGroups.push(new favouriteApi());

    }

    setContentType(req, res, next) {
        res.set('Content-Type', 'application/json');
        next();
    }

    registerGroups() {
        this.loadRouteGroups();
        this.routeGroups.forEach((rg) => {

            this.app.use('/api' + rg.getRouterGroup(), this.setContentType, rg.getRouter());
        });
    }
}

module.exports = API;