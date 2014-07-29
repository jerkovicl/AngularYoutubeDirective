//Source code:       https://github.com/poxrud/youtube-directive-example
//Youtube API:       https://developers.google.com/youtube/iframe_api_reference

var ytApp = angular.module('YouTubeApp', []);

//3 control events for player (play, pause, stop)
/*
--> to send an event from a parent to its children the $broadcast method is used
--> to send events from the children to their respective parents, the $emit method is used instead.
--> to listen for events we use the $on method on the scope.
*/
ytApp.constant('YT_event', {
    STOP: 0,
    PLAY: 1,
    PAUSE: 2,
    STATUS_CHANGE: 3
});

ytApp.controller('YouTubeCtrl', function ($scope, YT_event) {
    //initial settings
    $scope.yt = {
        width: 600,
        height: 480,
        videoid: "-X6qF7sF9eo",
        playerStatus: "NOT PLAYING"
    };

    //Angular only has knowledge of data that is attached to the scope, once we attach YT_event to the local scope it works
    $scope.YT_event = YT_event;

    $scope.sendControlEvent = function (ctrlEvent) {
        this.$broadcast(ctrlEvent);
    };

    $scope.$on(YT_event.STATUS_CHANGE, function (event, data) {
        $scope.yt.playerStatus = data;
    });

});

ytApp.directive('youtube', function ($window, YT_event) {
    return {
        restrict: "E",

        scope: {
            height: "@",
            width: "@",
            videoid: "@"
        },

        template: '<div></div>',

        link: function (scope, element, attrs, $rootScope) {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            var player;

            $window.onYouTubeIframeAPIReady = function () {

                player = new YT.Player(element.children()[0], {
                    playerVars: {
                        autoplay: 0,
                        html5: 1,
                        theme: "dark",
                        modesbranding: 0,
                        color: "black",
                        iv_load_policy: 3,
                        showinfo: 1,
                        controls: 1
                    },

                    height: scope.height,
                    width: scope.width,
                    videoId: scope.videoid,

                    events: {
                        'onStateChange': function (event) {

                            var message = {
                                event: YT_event.STATUS_CHANGE,
                                data: ""
                            };

                            switch (event.data) {
                            case YT.PlayerState.PLAYING:
                                message.data = "PLAYING";
                                break;
                            case YT.PlayerState.ENDED:
                                message.data = "ENDED";
                                break;
                            case YT.PlayerState.UNSTARTED:
                                message.data = "NOT PLAYING";
                                break;
                            case YT.PlayerState.PAUSED:
                                message.data = "PAUSED";
                                break;
                            }

                            scope.$apply(function () {
                                scope.$emit(message.event, message.data);
                            });

                            console.log("STATUS CHANGED. New status: " + message.data);
                        }
                    }
                });
            };

            scope.$watch('videoid', function (newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }

                player.cueVideoById(scope.videoid);

            });

            scope.$watch('height + width', function (newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }

                player.setSize(scope.width, scope.height);

            });

            scope.$on(YT_event.STOP, function () {
                player.seekTo(0);
                player.stopVideo();
            });

            scope.$on(YT_event.PLAY, function () {
                player.playVideo();
            });

            scope.$on(YT_event.PAUSE, function () {
                player.pauseVideo();
            });

        }
    };
});
