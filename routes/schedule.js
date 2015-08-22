var ScheduleDAO = require('../schedules').ScheduleDAO
  , sanitize = require('validator').sanitize;

 //----------------new-------------//
function ScheduleHandler (db){
    "use strict";

    var schedule = new ScheduleDAO(db);

    this.handleNewSchedule = function(req, res, next){
        "use strict";

        //posted from view(html) file
        var startDate = String(req.body.startDate);
        var endDate = String(req.body.endDate);
        var content = String(req.body.scheduleContent);

        //calling insertSchedule API
        schedule.insertSchedule(startDate, endDate, content, function(err, results){
            "use strict";
            if (err) return next(err);
            return res.redirect('/schedule');
        });

    }

    this.displaySchedulePage = function(req, res, next){
		"use strict";

		/*var today = new Date();
		var yyyy = today.getFullYear();
		var mm = today.getMonth() + 1;
		var dd = today.getDate();*/

    	schedule.getSchedule(function(err, results){
    		"use strict";

    		if(err) return next(err);
    		//console.log(results);

    		return res.render('schedule_template', {
	    		schedule : results,
                username : req.username //for session holding
    		});
    	});
	}

}

module.exports = ScheduleHandler;
//----------------end-------------//