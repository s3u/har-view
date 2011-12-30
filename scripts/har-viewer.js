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
(function ($) {
    var HarView = function (element, options) {
        var template = "<div id='{{id}}-req' class='request'> \
            <span class='plus' id='{{id}}'>&nbsp;&nbsp;&nbsp;&nbsp;</span>\
            <span class='method'>{{request.method}}</span>\
            <span class='uri' title='{{request.url}}'>{{request.url}}</span>\
            {{response.status}}\
            <span class='bodySize'>{{response.bodySize}}</span>\
            <span class='time'>{{time}}</span>\
        <span id='{{id}}-timeline'>\
                <span class='timelineBar'><span class='timelineSlice timelineWaiting'\
                            style='width:{{timings.waiting}}px'></span><span \
                    class='timelineSlice timelineBlocked'\
                        style='width:{{timings.blocked}}px'></span><span\
                  class='timelineSlice timelineDns' style='width:{{timings.dns}}px'></span><span\
                  class='timelineSlice timelineConnect'\
                  style='width:{{timings.connect}}px'></span><span\
                  class='timelineSlice timelineSend' style='width:{{timings.send}}px'></span><span\
                  class='timelineSlice timelineWait' style='width:{{timings.wait}}px'></span><span\
                  class='timelineSlice timelineReceive'\
                  style='width:{{timings.receive}}px'></span></span>\
            </span>\
        </div>\
        <div class='details' id='{{id}}-details'>\
            <div id='{{id}}-tabs'>\
                <ul>\
                    <li><a href='#{{id}}-tab-1'>Headers</a></li>\
                    <li><a href='#{{id}}-tab-2'>Request Body</a></li>\
                    <li><a href='#{{id}}-tab-3'>Response Body</a></li>\
                </ul>\
                <div id='{{id}}-tab-1'>\
                    <p class='hv-header'>Request headers</p>\
                    <table>\
                        {{#request.headers}}\
                        <tr>\
                            <td>{{name}}:</td>\
                            <td>{{value}}</td>\
                        </tr>\
                        {{/request.headers}}\
                    </table>\
                    <p class='hv-header'>Response headers</p>\
                    <table>\
                        {{#response.headers}}\
                        <tr>\
                            <td>{{name}}:</td>\
                            <td>{{value}}</td>\
                        </tr>\
                        {{/response.headers}}\
                    </table>\
                </div>\
                <div id='{{id}}-tab-2'>\
                    <pre class='hv-body'>{{request.body}}</pre>\
                </div>\
                <div id='{{id}}-tab-3'>\
                    <pre class='hv-body'>{{response.body}}</pre>\
                </div>\
            </div>\
        </div>";

        var log = {
            entries: {}
        };
        var totals = {};
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
        }
        this.request = function (id, request) {
            if(log.entries[id]) {
                log.entries[id].request = request;
            }
            else {
                log.entries[id] = {
                    id: id,
                    request: request
                };
            }
            _renderAll();
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
            var data = log.entries[id];
            if(data) {
                data.timings = timings;
                data.time = total;
                var t = new Date(data.startedDateTime).getTime();
                t = t + total;
                right = (right > t) ? right : t;

                console.log(left + ' ' + right + ' -- ' + (right - left));
            }
            else {
                // Error otherwise
            }

            totals[id] = total;
            _renderAll();

            $('#left').html(right - left);
        };

        this.response = function (id, response) {
            if(log.entries[id]) {
                log.entries[id].response = response;
            }
            else {
                // Error otherwise
            }
            _renderAll();
        }

        var _renderAll = function() {
            $.each(log.entries, function(id, value) {
                _render(id);
            })
        };

        var _render = function (id) {
            var frac = 400 / (right - left);

            var html, source, dest;
            var data = log.entries[id], timings = {};
            if(data.timings) {
                $.each(data.timings, function (key, value) {
                    timings[key] = frac * value;
                });
            }
            html = Mustache.to_html(template, {
                id: id,
                time: totals[id],
                request: data.request,
                response: data.response,
                timings: timings
            });

            if($('#' + id + '-req').html()) {
                $('#' + id + '-details').remove();
                $('#' + id + '-req').replaceWith(html);
            }
            else {
                $('#har').append(html);
            }

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
                    dest = $('#' + event.target.id + '-details').hide();
                }
            });

            // Enable tabbed view
            $('#' + id + '-tabs').tabs();

            $('#' + id + '-timeline').attr('title', JSON.stringify(data.timings));

            $().tooltip();

        };
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



