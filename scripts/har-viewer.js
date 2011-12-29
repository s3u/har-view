(function ($) {
    var HarView = function (element, options) {
        var template = "<div id='{{id}}-req' class='request'> \
            <span class='plus' id='{{id}}'>&nbsp;&nbsp;&nbsp;&nbsp;</span>\
            <span class='method'>{{request.method}}</span>\
            <span class='uri'>{{request.url}}</span>\
            {{response.status}}\
            <span class='bodySize'>{{response.bodySize}}</span>\
            <span class='time'>{{time}}</span>\
        <span id='{{id}}-timeline'>\
                <span class='timelineBar'><span class='timelineSlice timelineBlocked'\
                                                style='width:{{timings.blocked}}%'></span><span\
                  class='timelineSlice timelineDns' style='width:{{timings.dns}}%'></span><span\
                  class='timelineSlice timelineConnect'\
                  style='width:{{timings.connect}}%'></span><span\
                  class='timelineSlice timelineSend' style='width:{{timings.send}}%'></span><span\
                  class='timelineSlice timelineWait' style='width:{{timings.wait}}%'></span><span\
                  class='timelineSlice timelineReceive'\
                  style='width:{{timings.receive}}%'></span></span>\
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
        var fracs = {};

        // Public method - can be called from client code
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
            _render(id);
        };

        this.timings = function (id, timings) {
            var total = 0;
            $.each(timings, function (key, value) {
                if(value > -1) {
                    total += value;
                }
            });
            if(log.entries[id]) {
                log.entries[id].timings = timings;
                log.entries[id].time = total;
            }
            else {
                // Error otherwise
            }

            totals[id] = total;
            _render(id);
        };

        this.response = function (id, response) {
            if(log.entries[id]) {
                log.entries[id].response = response;
            }
            else {
                // Error otherwise
            }
            _render(id);
        }

        var _render = function (id) {
            // Update fracs
            var total = 0;
            $.each(totals, function (key, value) {
                total += value;
            });
            $.each(totals, function (key, value) {
                fracs[key] = totals[id] / total;
            });

            var html, source, dest;
            var data = log.entries[id], timings = {};
            if(data.timings) {
                $.each(data.timings, function(key, value) {
                    timings[key] = fracs[id] * value;
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



