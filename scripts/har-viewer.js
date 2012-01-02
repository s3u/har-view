/**
 * Copyright 2011 Subbu Allamaraju
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * See https://github.com/s3u/har-view for the latest.
 *
 * See https://github.com/s3u/har-view/blob/master/examples/index.html for an example.
 */
(function ($) {
    var HarView = function (element, options) {
        var reqTemplate = "<div id='{{id}}-req' class='request'>\
            <span class='plus' id='{{id}}'>&nbsp;&nbsp;&nbsp;</span>\
            <span class='method' id='{{id}}-method'>{{request.method}}</span>\
            <span class='url' id='{{id}}-url' title='{{request.url}}'>{{request.url}}</span>\
            <span class='status' id='{{id}}-status'>{{response.status}}</span>\
            <span class='bodySize' id='{{id}}-bodySize'>{{response.bodySize}}</span>\
            <span><span class='time' id='{{id}}-time'>{{time}}</span> msec</span>\
            <span class='timelineBar' id='{{id}}-timeline'></span>\
        </div>";

        var detailsTemplate = "<div class='details' id='{{id}}-details'>\
            <td colspan='7'>\
                <div id='{{id}}-tabs'>\
                    <ul>\
                        <li><a href='#{{id}}-tab-1'>Headers</a></li>\
                        <li><a href='#{{id}}-tab-2'>Request Body</a></li>\
                        <li><a href='#{{id}}-tab-3'>Response Body</a></li>\
                    </ul>\
                    <div id='{{id}}-tab-1'>\
                        <p class='header'>Request headers</p>\
                        <div id='{{id}}-req-headers'></div>\
                        <p class='header'>Response headers</p>\
                        <div id='{{id}}-resp-headers'></div>\
                    </div>\
                    <div id='{{id}}-tab-2'>\
                        <pre id='{{id}}-req-body' class='body'>{{request.body}}</pre>\
                    </div>\
                    <div id='{{id}}-tab-3'>\
                        <pre id='{{id}}-resp-body' class='body'>{{response.body}}</pre>\
                    </div>\
                </div>\
            </td>\
        </div>";

        var headersTemplate = "<table>\
            {{#headers}}\
            <tr>\
                <td>{{name}}:</td>\
                <td>{{value}}</td>\
            </tr>\
            {{/headers}}\
        </table>";

        var timingsTemplate = "<span id='{{id}}-lpad' class='timelinePad' style='width:{{timings._lpad}}%'></span><span\
          id='{{id}}-blocked' class='timelineSlice timelineBlocked' style='width:{{timings.blocked}}%'></span><span\
          id='{{id}}-dns' class='timelineSlice timelineDns' style='width:{{timings.dns}}%'></span><span\
          id='{{id}}-connect' class='timelineSlice timelineConnect' style='width:{{timings.connect}}%'></span><span\
          id='{{id}}-send' class='timelineSlice timelineSend' style='width:{{timings.send}}%'></span><span\
          id='{{id}}-wait' class='timelineSlice timelineWait' style='width:{{timings.wait}}%'></span><span\
          id='{{id}}-receive' class='timelineSlice timelineReceive' style='width:{{timings.receive}}%'></span><span\
          id='{{id}}-rpad' class='timelinePad' style='width:{{timings._rpad}}%'></span>";

        $(element).addClass('har');

        var log = {
            entries: {}
        };
        var totals = {};
        var pads = {};
        var left, right;

        this.entry = function (id, entry) {
            log.entries[id] = entry;
            var t = new Date(entry.startedDateTime).getTime();
            if(left && right) {
                left = (left < t) ? left : t;
                right = (right > t) ? right : t;
            }
            else {
                left = right = t;
            }

            _render(id);
        }
        this.request = function (id, request) {
            if(log.entries[id]) {
                log.entries[id].request = request;
                _updateRequest(id, request);
            }
            else {
                log.entries[id] = {
                    id: id,
                    request: request
                };
                _render(id);
            }
        };

        // left: min(startedDateTime)
        // right: max(startdDateTime + time)
        this.timings = function (id, timings) {
            var total = 0;
            $.each(timings, function (key, value) {
                if(value > -1) {
                    total += value;
                }
            });
            _updateField('#' + id + '-time', total);

            var data = log.entries[id];
            if(data) {
                data.timings = timings;
                data.time = total;
                var t = new Date(data.startedDateTime).getTime();
                t = t + total;
                right = (right > t) ? right : t;

                var html = Mustache.to_html(timingsTemplate, {
                    timings: timings,
                    id: id
                });
                $('#' + id + '-timeline').append($(html));
                $('#' + id + '-timeline').attr('title', JSON.stringify(data.timings));

                _updateAllTimings();

            }
            else {
                // Error otherwise
            }

        };

        this.response = function (id, response) {
            if(log.entries[id]) {
                log.entries[id].response = response;
                _updateResponse(id, response);
            }
            else {
                // Error otherwise
            }
        }

        var _render = function (id) {
            var html, source, dest;
            var data = log.entries[id], timings = {};
            html = Mustache.to_html(reqTemplate, {
                id: id,
                time: totals[id],
                request: data.request,
                response: data.response,
                timings: timings
            });

            $(element).append($(html));

            html = Mustache.to_html(detailsTemplate, {
                id: id,
                time: totals[id],
                request: data.request,
                response: data.response,
                timings: timings
            });

            $(element).append($(html));

            source = $('#' + id);
            source.click(function (event) {
                if($('#' + event.target.id).hasClass('plus')) {
                    $('#' + event.target.id).removeClass('plus');
                    $('#' + event.target.id).addClass('minus');
                    $('#' + event.target.id + '-details').show();
                }
                else {
                    $('#' + event.target.id).removeClass('minus');
                    $('#' + event.target.id).addClass('plus');
                    $('#' + event.target.id + '-details').hide();
                }
            });
            $('#' + id + '-details').hide();

            // Enable tabbed view
            $('#' + id + '-tabs').tabs();

        };

        var _updateRequest = function(id, request) {
            _updateField('#' + id + '-method', request.method);
            _updateField('#' + id + '-url', request.url);
            $('#' + id + '-url').resizable({handles: 'e'});
            $('#' + id + '-url').bind('resize', function(event, ui) {
                $('.url').width(ui.size.width);
            });

            if(request.headers) {
                _updateHeaders(id, true, request.headers);
            }
            _updateField('#' + id + '-req-body', request.body);
        };

        var _updateResponse = function(id, response) {
            _updateField('#' + id + '-status', response.status);

            if(response.headers) {
                _updateHeaders(id, false, response.headers);
            }
            if(response.body) {
                _updateField('#' + id + '-resp-body', response.body);
                _updateField('#' + id + '-bodySize', response.body.length);
            }
        }

        var _updateField = function(id, field) {
            if(field) {
                $(id).text(field);
            }
        }

        var _updateHeaders = function(id, isRequest, headers) {
            var html = Mustache.to_html(headersTemplate, {
                headers: headers
            });

            $('#' + id + (isRequest ? '-req-headers' : '-resp-headers')).append($(html));
        }

        var _updateAllTimings = function() {
            $.each(log.entries, function(id, data) {
                if(data.timings) {
                    var total = 0;
                    $.each(data.timings, function (key, value) {
                        total += value;
                    });

                    var t = new Date(data.startedDateTime).getTime();
                    pads[id] = [t - left, right - t - total];
                    totals[id] = total + pads[id][0] + pads[id][1];

                    var frac = 100 / totals[id];
                    $.each(data.timings, function (key, value) {
                        $('#' + id + '-' + key).width(value * frac + '%');
                    });
                    $('#' + id + '-lpad').width(pads[id][0] * frac + '%');
                    $('#' + id + '-rpad').width(pads[id][1] * frac + '%');
                }
            });
        }
    };

    $.fn.HarView = function (options) {
        return this.each(function () {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if(element.data('HarView')) return;

            // pass options to plugin constructor
            var harView = new HarView(this, options);

            // Store plugin object in this element's data
            element.data('HarView', harView);
        });
    };
})(jQuery);



