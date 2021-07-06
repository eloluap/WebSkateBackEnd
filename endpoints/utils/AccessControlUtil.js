const AccessControl = require('accesscontrol');

const ac = new AccessControl();

ac.grant('user')
    .readOwn('user', ['*'])
    .updateOwn('user', ['*'])
    .deleteOwn('user', ['*'])
    .createOwn('forumPost', ['*'])
    .readAny('forumPost', ['*'])
    .updateOwn('forumPost', ['*'])
    .deleteOwn('forumPost', ['*'])
    .createOwn('comment', ['*'])
    .readAny('comment', ['*'])
    .updateOwn('comment', ['*'])
    .deleteOwn('comment', ['*'])
    .readAny('skatepark', ['*'])
    .createOwn('recension', ['*'])
    .readAny('recension', ['*'])
    .updateOwn('recension', ['*'])
    .deleteOwn('recension', ['*'])
    .createOwn('chat', ['*'])
    .readOwn('chat', ['*'])
    .createOwn('message', ['*'])
    .readOwn('message', ['*']);

ac.grant('admin')
    .extend('user')
    .createAny('user', ['*'])
    .readAny('user', ['*'])
    .updateAny('user', ['*'])
    .deleteAny('user', ['*'])
    .deleteAny('forumPost', ['*'])
    .deleteAny('comment', ['*'])
    .createAny('skatepark', ['*'])
    .updateAny('skatepark', ['*'])
    .deleteAny('skatepark', ['*'])
    .deleteAny('recension', ['*']);

module.exports = ac;