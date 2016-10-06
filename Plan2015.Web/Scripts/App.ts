﻿module Activity.Index {
    class ActivityPointViewModel {
        id: number;
        houseId: number;
        houseName: string;
        amount: KnockoutObservable<number>;
        visible: KnockoutObservable<boolean>;

        constructor(point: IActivityPointDto) {
            this.id = point.id;
            this.houseId = point.houseId;
            this.houseName = point.houseName;
            this.amount = ko.observable(point.amount);
            this.visible = ko.observable(point.visible);
        }
    }

    class ActivityViewModel {
        id: number;
        name: string;
        totalPoints: number;
        points: KnockoutObservableArray<ActivityPointViewModel>;
        houseNames: string;
        sum: KnockoutComputed<number>;
        allVisible: KnockoutComputed<boolean>;
        isValid: KnockoutComputed<boolean>;
        isExpanded = ko.observable<boolean>();

        toggleExpanded() {
            this.isExpanded(!this.isExpanded());
        }

        constructor(activity: IActivityDto) {
            this.id = activity.id;
            this.name = activity.name;
            this.totalPoints = activity.totalPoints;
            this.points = ko.observableArray(ko.utils.arrayMap(activity.points, p => new ActivityPointViewModel(p)));
            this.houseNames = ko.utils.arrayMap(activity.points, p => p.houseName).join(', ');
            this.sum = ko.computed(() => {
                var sum = 0;
                ko.utils.arrayForEach(this.points(), p => {
                    sum += (+p.amount() || 0);
                });
                return sum;
            });
            this.allVisible = ko.computed({
                read: () => {
                    return !ko.utils.arrayFirst(this.points(), p => !p.visible());
                },
                write: value => {
                    ko.utils.arrayForEach(this.points(), p => p.visible(value));
                }
            });
            this.isValid = ko.computed(() => (this.totalPoints >= this.sum()));
        }

        convertPoints() {
            var sum = 0;
            ko.utils.arrayForEach(this.points(), p => {
                sum += (+p.amount() || 0);
            });
            var total = this.totalPoints;
            if (sum === 0) return;
            
            var rate = total / sum;

            ko.utils.arrayForEach(this.points(), p => {
                p.amount(Math.round(p.amount() * rate));
            });
        }

        sendUpdate(activity: ActivityViewModel) {
            $.ajax({
                url: '/Api/Activity/' + this.id,
                type: 'PUT',
                data: <IActivityDto> {
                    id: this.id,
                    name: this.name,
                    totalPoints: this.totalPoints,
                    points: ko.utils.arrayMap(this.points(), p => {
                        return <IActivityPointDto> {
                            id: p.id,
                            houseId: p.houseId,
                            houseName: p.houseName,
                            amount: p.amount(),
                            visible: p.visible()
                        }
                    })
                }
            });

            this.isExpanded(false);
        }

        sendDelete() {
            if (!confirm("Er du sikker på du vil slette begivenheden?")) return;

            $.ajax({
                url: '/Api/Activity/' + this.id,
                type: 'DELETE'
            });
        }
    }

    class CreateActivityViewModel {
        name = ko.observable<string>();
        totalPoints = ko.observable<number>();
        houseIds = ko.observableArray<number>();
        isValid = ko.computed<boolean>(() => (this.name() && this.totalPoints() && this.houseIds().length > 0));
    }

    export class App {
        newActivity = ko.observable(new CreateActivityViewModel());
        houses = ko.observableArray<IHouseDto>();
        activities = ko.observableArray<ActivityViewModel>();

        constructor() {
            var hub = $.connection.activityHub;
            
            hub.client.add = activity => {
                this.add(activity);
            };

            hub.client.update = activity => {
                this.update(activity);
            };

            hub.client.remove = id => {
                this.remove(id);
            };

            $.connection.hub.start();

            $.get('/Api/Activity', activities => {
                ko.utils.arrayForEach(activities, activity => {
                    this.add(<IActivityDto>activity);
                });
            }, 'json');

            $.get('/Api/House', houses => {
                this.houses(houses);
            }, 'json');
        }

        add(activity: IActivityDto) {
            this.activities.push(new ActivityViewModel(activity));
        }

        remove(id: number) {
            this.activities.remove(a => (a.id === id));
        }

        update(activity: IActivityDto) {
            var old = ko.utils.arrayFirst(this.activities(), l => (l.id === activity.id));
            if (old) {
                old.points(ko.utils.arrayMap(activity.points, p => new ActivityPointViewModel(p)));
            }
        }

        sendCreate() {
            var activity = this.newActivity();

            $.ajax({
                url: '/Api/Activity',
                type: 'POST',
                data: <IActivityDto>{
                    name: activity.name(),
                    totalPoints: activity.totalPoints(),
                    points: ko.utils.arrayMap(activity.houseIds(), id => {
                        return <IActivityPointDto> {
                            houseId: id,
                            amount: 0
                        }
                    })
                }
            });

            this.newActivity(new CreateActivityViewModel());
        }
    }
}

module MagicGames.Marker {
    class StatusViewModel {
        progress = ko.observable<number>(0);
        constructor(public name: string) { }
    }

    class UploadViewModel {
        files = ko.observableArray<File>();
        status = ko.observableArray<StatusViewModel>();

        selectFile = (a: App, e) => {
            var fileList: FileList = e.target.files;
            var files: File[] = [];
            for (var i = 0; i < fileList.length; i++) {
                files.push(fileList[i]);
            }
            this.files(files);
            this.status([]);
        }

        sendUplaod() {
            this.status(ko.utils.arrayMap(this.files(), file => {
                var status = new StatusViewModel(file.name);
                Helpers.readText(file)
                    .progress(p => status.progress(p / 2))
                    .done(d => {
                        $.ajax({
                            url: '/Api/MagicGamesMarkerSwipe',
                            type: 'POST',
                            data: <ITurnoutSwipeDto>{
                                name: file.name,
                                data: d
                            }
                        }).done(() => status.progress(100));
                    });
                return status;
            }));
            this.files(null);
        }

        isValid = ko.computed(() => !!this.files());
    }

    export class App {
        upload = ko.observable(new UploadViewModel());
    }
}

module MagicGames.Setup {
    class IntervalViewModel {
        scoutId: number;
        scoutName: string;
        amount: KnockoutObservable<number>;

        constructor(interval: IMagicGamesIntervalDto) {
            this.scoutId = interval.scoutId;
            this.scoutName = interval.scoutName;
            this.amount = ko.observable(interval.amount);
        }
    }

    class SetupViewModel {
        houseId: number;
        houseName: string;
        isSaved = ko.observable<boolean>(true);

        constructor(setup: IMagicGamesSetupDto) {
            this.houseId = setup.houseId;
            this.houseName = setup.houseName;
            this.intervals(ko.utils.arrayMap(setup.intervals, interval => {
                return new IntervalViewModel(interval);
            }));
        }

        intervals = ko.observableArray<IntervalViewModel>();

        availableIntervals = ko.computed<number[]>(() => {
            var intervals = this.intervals();
            var unused = this.getIntervals(intervals.length);

            ko.utils.arrayForEach(intervals, i => {
                var index = unused.indexOf(i.amount());
                if (index !== -1) {
                    unused.splice(index, 1);
                } else {
                    i.amount(0);
                }
            });

            return unused;
        });

        next = ko.computed<string>(() => {
            var next = this.availableIntervals()[0];
            return next ? 'Næste: ' + next + ' min' : 'Alle intervaller er fordelt.';
        });

        setInterval = (interval: IntervalViewModel) => {
            console.log('click');
            interval.amount(!interval.amount() ? this.availableIntervals()[0] : 0);
            this.isSaved(false);
        }

        sendSave() {
            $.ajax({
                url: '/Api/MagicGamesSetup/' + this.houseId,
                type: 'PUT',
                data: <IMagicGamesSetupDto>{
                    houseId: this.houseId,
                    houseName: this.houseName,
                    intervals: ko.utils.arrayMap(this.intervals(), i => {
                        return <IMagicGamesIntervalDto> {
                            scoutId: i.scoutId,
                            scoutName: i.scoutName,
                            amount: i.amount()
                        }
                    })
                }
            });
        }

        update(setup: IMagicGamesSetupDto) {
            this.intervals(ko.utils.arrayMap(setup.intervals, interval => {
                return new IntervalViewModel(interval);
            }));
            this.isSaved(true);
        }

        isExpanded = ko.observable<boolean>();

        toggleExpanded() {
            this.isExpanded(!this.isExpanded());
        }

        distribution = ko.computed(() => ko.utils.arrayMap(this.intervals(), i => '(' + i.scoutName + ' = ' + (i.amount() || '?') + ' min)').join(', '));

        private getIntervals(quantity): number[] {
            var priority = [5, 10, 15, 20, 30];
            var intervals = [];
            for (var i = 0; i < quantity; i++) {
                intervals.push(priority[i % priority.length]);
            }
            intervals.sort(Helpers.compare);
            return intervals;
        }
    }

    export class App {
        setups = ko.observableArray<SetupViewModel>();
        constructor() {
            var hub = $.connection.magicGamesSetupHub;

            hub.client.update = dto => {
                var house = ko.utils.arrayFirst(this.setups(), h => (h.houseId === dto.houseId));
                house.update(dto);
            };

            $.connection.hub.start();

            $.get('/Api/MagicGamesSetup', setups => {
                this.setups(ko.utils.arrayMap(setups, setup => {
                    return new SetupViewModel(<IMagicGamesSetupDto>setup);
                }));
            }, 'json');
        }
    }
}

module MagicGames.Score {
    export class App {
        scores = ko.observableArray<IMagicGamesScoreDto>();

        constructor() {
            $.get('/Api/MagicGamesScore', scores => {
                this.scores(scores);
            }, 'json');
        }
    }
}

module Turnout.Index {
    class StatusViewModel {
        progress = ko.observable<number>(0);
        constructor(public name: string) {}
    }

    class UploadViewModel {
        files = ko.observableArray<File>();
        status = ko.observableArray<StatusViewModel>();
        
        selectFile = (a: App, e) => {
            var fileList: FileList = e.target.files;
            var files: File[] = [];
            for (var i = 0; i < fileList.length; i++) {
                files.push(fileList[i]);
            }
            this.files(files);
            this.status([]);
        }

        sendUplaod() {
            this.status(ko.utils.arrayMap(this.files(), file => {
                var status = new StatusViewModel(file.name);
                Helpers.readText(file)
                    .progress(p => status.progress(p / 2))
                    .done(d => {
                        $.ajax({
                            url: '/Api/TurnoutSwipe',
                            type: 'POST',
                            data: <ITurnoutSwipeDto> {
                                name: file.name,
                                data: d
                            }
                        }).done(() => status.progress(100));
                    });
                return status;
            }));
            this.files(null);
        }

        isValid = ko.computed(() => !!this.files());
    }

    export class App {
        upload = ko.observable(new UploadViewModel());
    }
}

module Punctuality.Index {
    class PunctualityViewModel {
        id: number;
        name: string;
        deadline: string;
        all: boolean;

        constructor(punctuality: IPunctualityDto) {
            this.id = punctuality.id;
            this.name = punctuality.name;
            this.deadline = punctuality.deadline.replace('T', ' ');
            this.all = punctuality.all;
        }

        sendDelete() {
            if (!confirm("Er du sikker på du vil slette punktlighed? Alle evt. points slettes også.")) return;

            $.ajax({
                url: '/Api/Punctuality/' + this.id,
                type: 'DELETE'
            });
        }
    }

    class CreatePunctualityViewModel {
        name = ko.observable<string>();
        deadlineDate = ko.observable<string>();
        deadlineTime = ko.observable<string>();
        deadline = ko.computed<string>(() => {
            return this.deadlineDate() + 'T' + this.deadlineTime();
        });
        all = ko.observable<boolean>(false);
        isValid = ko.computed<boolean>(() => true || !!this.name() && !!this.deadline());
    }

    export class App {
        newPunctuality = ko.observable(new CreatePunctualityViewModel());

        punctualities = ko.observableArray<PunctualityViewModel>();

        sendCreate() {
            var punctuality = this.newPunctuality();

            $.ajax({
                url: '/Api/Punctuality',
                type: 'POST',
                data: <IPunctualityDto>{
                    name: punctuality.name(),
                    deadline: punctuality.deadline(),
                    all: punctuality.all()
                }
            });
            this.newPunctuality(new CreatePunctualityViewModel());
        }

        constructor() {
            var hub = $.connection.punctualityHub;

            hub.client.add = activity => {
                this.add(activity);
            };

            hub.client.remove = id => {
                this.remove(id);
            };

            $.connection.hub.start();

            $.get('/Api/Punctuality', punctualities => {
                ko.utils.arrayForEach(punctualities, punctuality => {
                    this.add(<IPunctualityDto>punctuality);
                });
            }, 'json');
        }

        add(punctuality: IPunctualityDto) {
            this.punctualities.push(new PunctualityViewModel(punctuality));
            this.punctualities.sort((a: PunctualityViewModel, b: PunctualityViewModel) => {
                if (a.deadline < b.deadline) return -1;
                if (a.deadline > b.deadline) return 1;
                return 0;
            });
        }

        remove(id: number) {
            this.punctualities.remove(p => (p.id === id));
        }
    }
}

module Punctuality.Status {
    class HouseStatusViewModel {
        name: string;
        scouts: IPunctualityStatusScoutDto[];
        arrived: number;

        constructor(house: IPunctualityStatusHouseDto) {
            this.name = house.name;
            this.scouts = house.scouts;
            this.arrived = ko.utils.arrayFilter(house.scouts, s => s.arrived).length;
        }
    }

    export class App {
        status = ko.observable<IPunctualityStatusDto>();
        name = ko.observable<string>();
        all = ko.observable<boolean>();
        houses = ko.observableArray<HouseStatusViewModel>();

        constructor(id: number) {
            var hub = $.connection.punctualityStatusHub;

            hub.client.updated = status => {
                this.name(status.name);
                this.all(status.all);
                this.houses(ko.utils.arrayMap(status.houses, h => new HouseStatusViewModel(h)));
                this.status(status);
            };
            $.connection.hub.start().done(() => {
                hub.server.setId(id);
            });
        }
    }
}

module Score.Index {
    class ScoreHouseViewModel {
        constructor(public name: string, public visibleAmount: number, public hiddenAmount: number) {
        }
    }

    class ScoreSchoolViewModel {
        houses: ScoreHouseViewModel[];
        visibleAmount: number;
        hiddenAmount: number;

        constructor(public name: string, houses: IHouseScoreDto[]) {
            var sumH = 0;
            var sumV = 0;
            this.houses = ko.utils.arrayMap(houses, house => {
                sumV += house.amount;
                sumH += house.hiddenAmount;
                return new ScoreHouseViewModel(house.name, house.amount, house.hiddenAmount);
            }).sort((a: ScoreHouseViewModel, b: ScoreHouseViewModel) => {
                return b.visibleAmount - a.visibleAmount;
            });
            this.visibleAmount = sumV;
            this.hiddenAmount = sumH;
        }
    }

    export class App {
        schools = ko.observableArray<ScoreSchoolViewModel>();

        constructor() {
            var hub = $.connection.scoreHub;

            hub.client.updated = schools => {
                this.schools(ko.utils.arrayMap(schools, school => {
                    return new ScoreSchoolViewModel(school.name, school.houses);
                }).sort((a: ScoreSchoolViewModel, b: ScoreSchoolViewModel) => {
                    return b.visibleAmount - a.visibleAmount;
                }));
            }

            $.connection.hub.start();
        }
    }
}

module Helpers {
    export function readText(file: File): JQueryPromise<string> {
        var reader = new FileReader();
        var deferred: JQueryDeferred<string> = $.Deferred<string>();

        reader.onload = e => deferred.resolve((<FileReader>e.target).result);
        reader.onprogress = (e: ProgressEvent) => deferred.notify(e.loaded * 100 / e.total);
        reader.onerror = e => deferred.reject(e);
        reader.readAsText(file);

        return deferred.promise();
    }

    export function compare(a: any, b: any): number {
        return (a - b);
    }
}