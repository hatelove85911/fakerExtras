var _ = require('lodash/fp')
var moment = require('moment')
var faker = require('faker')

var timeDurRegExp = /^\d+[a-z]$/

// infer time extent by checking the argument type
// the arguments could be: ( Date, Date)
// or be: (Date, '9h')
// return {
//   start: Date,
//   end: Date
// }
var inferTimeExtent = function () {
  var ag = arguments
  var start
  var end
  start = new Date(ag[0])
  if (_.isDate(ag[1])) {
    end = new Date(ag[1])
  } else if (timeDurRegExp.test(ag[1])) {
    end = moment(start).add(+ag[1].slice(0, -1), ag[1].slice(-1)).toDate()
  }
  return {
    start: start,
    end: end
  }
}

faker.extras = {
  // return a sequence generator function
  seq: function (start, step) {
    var counter = 0
    step = step || 1
    return function () {
      var result = start + counter * step
      counter++
      return result
    }
  },
  // return a function which pick element from a list recursively
  list: function (l, step) {
    var counter = 0
    step = step || 1
    return function () {
      var result = l[counter * step >= l.length ? 0 : counter * step]
      counter++
      return result
    }
  },
  // fake a stop object:
  // {
  //  arr: between time extent,
  //  dep: between time extent
  // }
  stop: function () {
    var extent = inferTimeExtent.apply(null, arguments)
    var t1 = faker.date.between(extent.start, extent.end)
    var t2 = faker.date.between(extent.start, extent.end)

    return {
      arr: t1.getTime() > t2.getTime() ? t2 : t1,
      dep: t1.getTime() > t2.getTime() ? t1 : t2
    }
  },
  // fake a stage object
  // {
  //  dep: between time extent,
  //  arr: between time extent
  // }
  stage: function () {
    var extent = inferTimeExtent.apply(null, arguments)
    var t1 = faker.date.between(extent.start, extent.end)
    var t2 = faker.date.between(extent.start, extent.end)

    return {
      dep: t1.getTime() > t2.getTime() ? t2 : t1,
      arr: t1.getTime() > t2.getTime() ? t1 : t2
    }
  },
  // generate schedule ( n length of array of stage ) by specify a time extent
  scheduleByExtent: function (n) {
    var rightArgs = Array.prototype.slice.call(arguments, 1)
    var extent = inferTimeExtent.apply(null, rightArgs)
    var start = extent.start
    var end = extent.end
    // calculate time difference between two time point in mill seconds
    var diff = function (start, end) {
      return moment(end).diff(moment(start))
    }

    // get an array of n random offset between 0 -- value
    var nOffset = function (diff) {
      return _.times(function () {
        return faker.random.number(diff)
      }, n + 1)
    }

    var duplicateElements = function (array) {
      return _.concat(array, array)
    }

    // turn a segment: [offset1, offset2] ( offset2 > offset1) into a stage
    var turnSegmentIntoStop = _.bind(this, function (segment) {
      var t1 = moment(start).add(segment[0], 'ms').toDate()
      var t2 = moment(start).add(segment[1], 'ms').toDate()
      return this.stage(t1, t2)
    })

    var process = _.flow(diff, nOffset, duplicateElements, _.sortBy(_.identity), _.drop(1), _.dropRight(1), _.chunk(2), _.map(turnSegmentIntoStop))
    return process(start, end)
  },
  // generate schedule ( n length of array of stage ) by specify start point, transit interval and dwell interval
  // interval should be in the format '9h', '10d', '30m'
  scheduleByInterval: function (n, start, transitInterval, dwellInterval) {
    start = new Date(start)

    // turn an interval: '9h'(9 hour) into an interval object
    // {
    //  amount: 9,
    //  unit: 'h'
    // }
    var parseInterval = function (interval) {
      if (timeDurRegExp.test(interval)) {
        return {
          amount: +interval.slice(0, -1),
          unit: interval.slice(-1)
        }
      }
    }
    var transit = parseInterval(transitInterval)
    var dwell = parseInterval(dwellInterval)

    var formStage = function (transit, dep) {
      return {
        dep: dep,
        arr: faker.date.between(dep, moment(dep).add(transit.amount, transit.unit).toDate())
      }
    }

    var getNextDepTime = function (dwell, arr) {
      return faker.date.between(arr, moment(arr).add(dwell.amount, dwell.unit).toDate())
    }

    return _.reduce(function (result, i) {
      var dep = i > 0 ? getNextDepTime(dwell, result[i - 1].arr) : start
      var stage = formStage(transit, dep)
      result.push(stage)
      return result
    }, [], _.range(0, n))
  }
}

module.exports = faker
