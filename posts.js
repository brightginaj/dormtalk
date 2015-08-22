var fs = require('fs');
var pathMod = require('path');

/* The PostsDAO must be constructed with a connected database object */
function PostsDAO(db) {
    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof PostsDAO)) {
        console.log('Warning: PostsDAO constructor called without "new" operator');
        return new PostsDAO(db);
    }

    var posts = db.collection("posts");


    this.insertEntry = function (title, body, tags, author, path, callback) {
        "use strict";
        console.log("inserting blog entry : " + title);

        // fix up the permalink to not include whitespace
        //var permalink = title.replace( /\s/g, '_' );
        //permalink = permalink.replace( /\W/g, '' );
        var permalink = new Date().getTime();
        permalink = permalink.toString();

        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = today.getMonth()+1;
        var dd = today.getDate();
        var date = yyyy + '/' + mm + '/'  + dd;

        // Build a new post
        var post = {"title": title,
                "author": author,
                "body": body,
                "permalink":permalink,
                "tags": tags,
                "filepath" : path,
                "comments": [],
                "date": date,
                "raw_date" : today,
                "img" : ''};

        // now insert the post
        // hw3.2 TODO
        posts.insert(post, function(err, res){
            "use strict"
            if(err) return callback(err, null);
            else callback(err, res[0].permalink);
        })
        // TODO end
        //callback(Error("insertEntry Not Yet Implemented!"), null);
    }

    this.editPost = function (title, body, tags, permalink, callback){
        "use strict";

        var post = {"title" : title,
                "body" : body,
                "tags" : tags};

        posts.update({permalink : permalink}, {$set : post}, function(err, res){
            "use strict";
            if(err) return callback(err, null);
            else callback(err, permalink);
        })

    }

    this.deletePost = function(permalink, callback){
        "use strict";

        posts.findOne({'permalink' : permalink}, function(err, post){
            "use strict"

            if(err) return callback(err, null);
            //console.log(post.filepath);
            var rmPath = post.filepath;

            if(rmPath != '') {
                rmPath = pathMod.join(__dirname, '/uploads', rmPath);
                fs.unlinkSync(rmPath);
            }
        });

        posts.remove({'permalink' : permalink}, function(err, res){
            "use strict"
            if (err) return callback(err, null);
            callback(err, res);
        });

    }

    this.getPosts = function(callback) {
        "use strict";

        posts.find().sort('raw_date', -1).toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);
            //console.log("Found " + items.length + " posts");
            callback(err, items);
        });
    }

    this.getPostsByTag = function(tag, num, callback) {
        "use strict";

        posts.find({ tags : tag }).sort('date', -1).limit(num).toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);
            //console.log("Found " + items.length + " posts");
            callback(err, items);
        });
    }

    this.getPostByPermalink = function(permalink, callback) {
        "use strict";
        posts.findOne({'permalink': permalink}, function(err, post) {
            "use strict";

            if (err) return callback(err, null);

            callback(err, post);
        });
    }

    this.addComment = function(permalink, name, body, callback) {
        "use strict";

        var comment = {'author': name, 'body': body};

        //if (email != "") {
        //    comment['email'] = email
        //}

        // hw3.3 TODO
        posts.update({permalink : permalink}, {$push : {comments : comment}}, function(err, res){
            "use strict"
            if(err) callback(err, null);
            else callback(err, res);
        })
        //TODO end
        //callback(Error("addComment Not Yet Implemented!"), null);
    }

    this.deleteComment = function(permalink, body, callback){
        "use strict"

        posts.update({permalink : permalink}, {$pull : {comments : {body : body}}}, function(err, res){
            "use strict"
            if(err) callback(err, null);
            else callback(err, res);
        })
    }
    
}

module.exports.PostsDAO = PostsDAO;
