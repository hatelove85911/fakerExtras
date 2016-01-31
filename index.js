var _ = require('lodash/fp')
var moment = require('moment')
var faker = require('faker')

var inferTimeExtent = function () {
  var ag = arguments
  var start
  var end
  start = _.isString(ag[0]) ? moment(ag[0]).toDate : ag[0]
  if (_.isNumber(ag[1])) {
    end = moment(start).add(ag[1], ag[2] || 'h').toDate()
  } else {
    end = _.isString(ag[1]) ? moment(ag[0]).toDate : ag[1]
  }
  return {
    start: start,
    end: end
  }
}

faker.extras = {
  seq: function (start, step) {
    var counter = 0
    step = step || 1
    return function () {
      var result = start + counter * step
      counter++
      return result
    }
  },
  list: function (l, step) {
    var counter = 0
    step = step || 1
    return function () {
      var result = l[counter * step >= l.length ? 0 : counter * step]
      counter++
      return result
    }
  },
  stop: function () {
    var extent = inferTimeExtent.apply(null, arguments)
    var t1 = faker.date.between(extent.start, extent.end)
    var t2 = faker.date.between(extent.start, extent.end)

    return {
      arr: t1.getTime() > t2.getTime() ? t2 : t1,
      dep: t1.getTime() > t2.getTime() ? t1 : t2
    }
  },
  stage: function () {
    var extent = inferTimeExtent.apply(null, arguments)
    var t1 = faker.date.between(extent.start, extent.end)
    var t2 = faker.date.between(extent.start, extent.end)

    return {
      dep: t1.getTime() > t2.getTime() ? t2 : t1,
      arr: t1.getTime() > t2.getTime() ? t1 : t2
    }
  },
  scheduleByExtent: function (n) {
    var rightArgs = Array.prototype.slice.call(arguments, 1)
    var extent = inferTimeExtent.apply(null, rightArgs)
    var start = extent.start
    var end = extent.end
    var diff = function (start, end) {
      return moment(end).diff(moment(start))
    }

    var nOffset = function (diff) {
      return _.times(function () {
        return faker.random.number(diff)
      }, n + 1)
    }

    var duplicateElements = function (array) {
      return _.concat(array, array)
    }

    var turnSegmentIntoStop = _.bind(this, function (segment) {
      var t1 = moment(start).add(segment[0], 'ms').toDate()
      var t2 = moment(start).add(segment[1], 'ms').toDate()
      return this.stage(t1, t2)
    })

    var process = _.flow(diff, nOffset, duplicateElements, _.sortBy(_.identity), _.drop(1), _.dropRight(1), _.chunk(2), _.map(turnSegmentIntoStop))
    return process(start, end)
  },
  scheduleByInterval: function (n, start, transitExtent, dwellExtent) {
    var parseExtent = function(extent) {
      
    }

    var formStage = function(start, transitExtent) {
      if(/^\d+[a-z]$/.test( transitExtent )){
        
      }
      var transit = transitExtent


    }
    var formDwell = function(start, dwellExtent) {
      
    }
    return _.times(function () {

      
    }, n)
  }
}

module.exports = faker
