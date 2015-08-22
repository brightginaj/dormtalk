var PostsDAO = require('../posts').PostsDAO
  , sanitize = require('validator').sanitize; // Helper to sanitize form input

var fs = require('fs');
var pathMod = require('path');

/* The ContentHandler must be constructed with a connected db */
function ContentHandler (db) {
    "use strict";

    var posts = new PostsDAO(db);

    this.displayMainPage = function(req, res, next) {
        "use strict";

        posts.getPosts(function(err, results) {
            "use strict";

            if (err) return next(err);

            return res.render('blog_template', {
                title: 'blog homepage',
                username: req.username,
                myposts: results
            });
        });
    }

    this.displayMainPageByTag = function(req, res, next) {
        "use strict";

        var tag = req.params.tag;

        posts.getPostsByTag(tag, 10, function(err, results) {
            "use strict";

            if (err) return next(err);

            return res.render('blog_template', {
                title: 'blog homepage',
                username: req.username,
                myposts: results
            });
        });
    }

    this.displayPostByPermalink = function(req, res, next) {
        "use strict";

        var permalink = req.params.permalink;

        posts.getPostByPermalink(permalink, function(err, post) {
            "use strict";

            if (err) return next(err);

            if (!post) return res.redirect("/post_not_found");

            // init comment form fields for additional comment
            var comment = {'name': req.username, 'body': ""}

            return res.render('entry_template', {
                title: 'blog post',
                username: req.username,
                post: post,
                comment: comment,
                errors: ""
            });
        });
    }

    this.handleNewComment = function(req, res, next) {
        "use strict";
        var name = req.body.commentName;
        //var email = req.body.commentEmail;
        var body = req.body.commentBody;
        var permalink = req.body.permalink;

        // Override the comment with our actual user name if found
        if (req.username) {
            name = req.username;
            //console.dir(name);
        }

        if (!name || !body) {
            // user did not fill in enough information

            posts.getPostByPermalink(permalink, function(err, post) {
                "use strict";

                if (err) return next(err);

                if (!post) return res.redirect("/post_not_found");

                // init comment form fields for additional comment
                var comment = {'name': name, 'body': ""}

                var errors = "빈칸이 있어요!"

                return res.render('entry_template', {
                    title: 'blog post',
                    username: req.username,
                    post: post,
                    comment: comment,
                    errors: errors
                });
            });

            return;
        }

        // even if there is no logged in user, we can still post a comment
        posts.addComment(permalink, name, body, function(err, updated) {
            "use strict";

            if (err) return next(err);

            if (updated == 0) return res.redirect("/post_not_found");

            return res.redirect("/post/" + permalink);
        });
    }

    this.displayPostNotFound = function(req, res, next) {
        "use strict";
        return res.send('페이지가 없습니다!', 404);
    }

    this.displayNewPostPage = function(req, res, next) {
        "use strict";

        if (!req.username) return res.redirect("/login");

        return res.render('newpost_template', {
            subject: "",
            body: "",
            errors: "",
            tags: "",
            username: req.username
        });
    }

    this.displayEditPostPage = function(req, res, next){
        "use strict"

        var permalink = req.body.permalink;

        //Reuse .getPostByPermalink API to get post data via permalink
        posts.getPostByPermalink(permalink, function(err, post) {
            "use strict";

            if (err) return next(err);

            if (!post) return res.redirect("/post_not_found");

            //Modifying tags array in post to string
            var tags = '';
            for (var i = 0; i < post.tags.length; i++){
                if (i == post.tags.length-1) {
                    tags = tags + post.tags[i]
                }
                else {
                    tags = tags + post.tags[i] + ','
                }
            }
            //console.dir('tags : ' + tags);

            //Change <br> in edit page to \n
            var temp = post.body.replace(/<br\s*[\/]?>/gi, '\n');
            post.body = temp;

            return res.render('editpost_template', {
                title: 'blog post',
                username: req.username,
                post: post,
                tags : tags,
                errors: ""
            });
        });        

    }

    function extract_tags(tags) {
        "use strict";

        var cleaned = [];

        var tags_array = tags.split(',');

        for (var i = 0; i < tags_array.length; i++) {
            if ((cleaned.indexOf(tags_array[i]) == -1) && tags_array[i] != "") {
                cleaned.push(tags_array[i].replace(/\s/g,''));
            }
        }

        return cleaned
    }

    this.handleNewPost = function(req, res, next) {
        "use strict";

        var title = req.body.subject;
        var post = req.body.body;
        var tags = req.body.tags;
        var path = req.files.userPhoto.path;
        var rmPath = pathMod.join(__dirname, '/../', path);
        var fileSize = Number(req.files.userPhoto.size);

        if (req.files.userPhoto.originalFilename != '') {
            path = path.slice(8);
            if(fileSize > 10485760) {
                //size limit error msg
                var error1 = "ERROR : 10MB 이하의 사이즈만 upload 가능합니다.";
                //remove files from HTML form
                fs.unlinkSync(rmPath);
                path = '';
                return res.render("newpost_template", {subject:title, username:req.username, body:post, tags:tags, errors:error1});
            }

        } else {
            //remove emptyfile when user leave the upload form empty
            //console.log(temp);
            fs.unlinkSync(rmPath);
            path = '';
        }

        if (!req.username) return res.redirect("/signup");

        if (!title || !post) {
            var error2 = "빈칸이 있어요!";
            return res.render("newpost_template", {subject:title, username:req.username, body:post, tags:tags, errors:error2});
        }

        var tags_array = extract_tags(tags)

        // looks like a good entry, insert it escaped
        var escaped_post = sanitize(post).escape();

        // substitute some <br> for the paragraph breaks
        var formatted_post = escaped_post.replace(/\r?\n/g,'<br>');

        posts.insertEntry(title, formatted_post, tags_array, req.username, path, function(err, permalink) {
            "use strict";

            if (err) return next(err);

            // now redirect to the blog permalink
            return res.redirect("/post/" + permalink)
        });
    }
 

    this.handleEditPost = function(req, res, next) {
        "use strict";

        var title = req.body.subject
        var post = req.body.body
        var tags = req.body.tags
        var permalink = req.body.permalink

        if (!req.username) return res.redirect("/signup");

        if (!title || !post) {
            var errors = "빈칸이 있어요!";
            return res.render("newpost_template", {subject:title, username:req.username, body:post, tags:tags, errors:errors});
        }

        var tags_array = extract_tags(tags);
        var escaped_post = sanitize(post).escape();
        var formatted_post = escaped_post.replace(/\r?\n/g,'<br>');

        posts.editPost(title, formatted_post, tags_array, permalink, function(err, permalink) {
            "use strict";

            if (err) return next(err);

            // now redirect to the blog permalink
            return res.redirect("/post/" + permalink)
        });
    }


    this.handleOldPost = function(req, res){
        "use strict";

        var permalink = req.body.permalink;

        posts.deletePost(permalink, function(err, results) {
            "use strict";

            if (err) return next(err);

            return res.redirect("/")
        });

    }

    this.handleOldComment = function(req, res){
        "use strict";

        var permalink = req.body.permalink;
        var body = req.body.commentBody;

        posts.deleteComment(permalink, body, function(err, results){
            "use strict";

            if (err) return next(err);

            return res.redirect("/post/" + permalink)
        })
    }

}



module.exports = ContentHandler;
