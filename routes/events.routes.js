const router = require('express').Router()
const User = require('../models/User.model')
const Issue = require('../models/Issue.model')
const uploader = require('./../config/uploader.config')
const axios = require("axios")
const issuesService = require('./../services/issues-location.service')

const { isLoggedIn, checkRoles } = require('./../middleware/route-guard')

const issueApi = new issuesService()

router.get('/', isLoggedIn, checkRoles('SOCIALWORKER', 'ADMIN'), (req, res) => {

    Issue
        .find()
        .select({ owner: 1, _id: 0 })
        .then((owners) => {
            const stringIds = owners.map(elm => elm.owner.toString())
            const uniqueOwners = [...new Set(stringIds)]
            const ownerPromises = uniqueOwners.map(elm => Issue.find({ owner: elm }).populate('owner'))
            return Promise.all(ownerPromises)
        })
        .then(eventsByOwner => {
            res.render('issues/list', {
                eventsByOwner,
                isAdmin: req.session.currentUser.role === 'ADMIN'
            })
        })
        .catch(err => {
            console.log(err)
            next()
        })
})


router.get('/crear', isLoggedIn, (req, res) => {

    res.render('issues/create')
})


router.post('/crear', isLoggedIn, (req, res) => {

    const { agression, description, location } = req.body
    const { _id: owner } = req.session.currentUser

    issueApi
        .getlocation(location)
        .then(res => {

            let place ={
                type: 'Point',
                coordinates: [res.data.results[0].geometry.location.lng, res.data.results[0].geometry.location.lat]
            }
            return Issue.create({ agression, description, location:place , owner })
        })
         
    
        .then(() => {
            res.redirect('/')
        })
        .catch(err => {
            console.log(err)
            next()
        })
})


router.post('/eliminar/:id', isLoggedIn, checkRoles('ADMIN'), (req, res) => {

    const { id: issue_id } = req.params

    Issue
        .findByIdAndDelete(issue_id)
        .then(() => {
            res.redirect('/eventos')
        })
        .catch(err => {
            console.log(err)
            next()
        })
})

module.exports = router