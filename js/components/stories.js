var Stories = (function() {

    // creates a meta-object with details for the given headline; used later 
    // to determine sort order
    function createMetaObj(headline, pos) {
        var subtext = headline.nextElementSibling;
        var res = subtext.textContent.trim().split(/\s+/); 
        var isJobPosting = (res.length === 3);
        var agePos = isJobPosting ? 0 : 4;
        var commentsPos = (res[8] === "flag") ? 10 : 8;
        return {
            elements: [headline, subtext, subtext.nextElementSibling],
            rank: -pos,
            points: !isJobPosting ? parseInt(res[0], 10) : 0,
            comments: !isJobPosting ? (parseInt(res[commentsPos], 10) || 0) : -1,
            age: (new Date()).getTime() - 
                    (parseInt(res[agePos], 10) * getMultiplier(res[agePos + 1])),
            parts: res // this is really just for debugging
        }
    }

    function getMultiplier(unit) {
        var mult = 1;
        switch (unit) {
            case "day":
            case "days":
                mult *= 24;
            case "hour":
            case "hours":
                mult *= 60;
            case "minute":
            case "minutes":
                mult *= 60;
            case "second":
            case "seconds":
                mult *= 1000;
        }
        return mult;
    }

    var _stories = null;

    function stories() {

        this.attributes({
            "articles": "tr.athing",
            "articlesTableBody": "tbody:first",
            "lastArticle": "tr.spacer:last",
            "ageLinks": ".subtext a:contains(' ago')",
            "commentLinks": ".subtext a:contains('comment')",
            "jobPostingSubtext": ".subtext:not(:has(a))"
        });
   
        // returns an array of "story" meta-objects
        this.getStories = function() {
            if (!_stories) {
                _stories = this.select("articles").map(function(i, el) {
                    return createMetaObj(this, i);
                }).get();
            }
            return _stories;
        };

        this.setupArticlesTable = function() {
            this.$node.addClass("articles");
            this.select("ageLinks").addClass("age");
            this.select("jobPostingSubtext").addClass("age");
            this.select("commentLinks").addClass("comments");
        };

        this.messagesObject = function() {
            var messages = {};
            var labels = [].slice.call(arguments);
            labels.forEach(function(label) {
                messages[label] = chrome.i18n.getMessage(label);
            });
            return messages;
        };

        this.renderSortControls = function() {
            var template = 
                '<div id="sortLinks" class="sort-action">&nbsp;&nbsp;{{sort_by_label}}\
                    <a href="#" class="selected">{{sort_by_number}}</a> |\
                    <a href="#">{{sort_by_points}}</a> |\
                    <a href="#">{{sort_by_age}}</a> |\
                    <a href="#">{{sort_by_comments}}</a>\
                </div>';
            var messages = this.messagesObject(
                "sort_by_label", "sort_by_number", "sort_by_points", "sort_by_age", "sort_by_comments");
            this.$node.before(Mustache.render(template, messages));
        };

        this.sortBy = function(ev, data) {
            var element = data && data.el;
            if (!element) {
                return;
            }
            var sortKey = $(element).text();
            var tbody = this.select("articlesTableBody");
            tbody.removeClass().addClass(sortKey);
            this.sort(
                tbody.get(0),
                sortKey === "#" ? "rank" : sortKey, 
                data.alreadySelected);
        };

        this.sort = function(tbody, sortKey, sorted) {
            var refEl = this.select("lastArticle").next().get(0);
            (function(stories) {
                return sorted ? stories.reverse() : 
                    stories.sort(function(a, b) { 
                        return b[sortKey] - a[sortKey] 
                    });
            })(this.getStories()).forEach(function(el) {
                el.elements.forEach(function(item) { 
                    tbody.insertBefore(item, refEl)
                });
            });
        };

        this.after('initialize', function() {
            this.setupArticlesTable();
            this.renderSortControls();
            this.on(document, "uiSortBy", this.sortBy);
        });
    }

    return flight.component(stories);

})();
