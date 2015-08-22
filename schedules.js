function ScheduleDAO(db){
	"use strict";

	/* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ScheduleDAO)) {
        console.log('Warning: ScheduleDAO constructor called without "new" operator');
        return new ScheduleDAO(db);
    }

    var schedule = db.collection("schedule");

	this.getSchedule = function(callback) {
        "use strict";

    	schedule.find().toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);
            callback(err, items);
        });
    }

    this.insertSchedule = function(startDate, endDate, content, callback){
    	"use strict";

        //console.log('insertSchedule API');

    	//get parameters from Routers
    	var scheduleinfo = {
    		'startDate' : startDate,
    		'endDate' : endDate,
    		'content' : content
    	};

    	schedule.insert(scheduleinfo, function(err, inserted){
            "use strict";

            if(err) return callback(err, null);
            callback(err, inserted[0]);
        })

    }

}

module.exports.ScheduleDAO = ScheduleDAO;