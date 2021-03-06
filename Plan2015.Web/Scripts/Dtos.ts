﻿interface IActivityDto {
    id: number;
    name: string;
    totalPoints: number;
    points: Array<IActivityPointDto>;
}

interface IActivityPointDto {
    id: number;
    houseId: number;
    houseName: string;
    amount: number;
    visible: boolean;
}

interface IHouseDto {
    id: number;
    name: string;
}

interface IHouseScoreDto {
    id: number;
    name: string;
    amount: number;
    hiddenAmount: number;
}

interface IMagicGamesIntervalDto {
    scoutId: number;
    scoutName: string;
    amount: number;
}

interface IMagicGamesMarkerSwipeDto {
    name: string;
    data: string;
}

interface IMagicGamesSetupDto {
    houseId: number;
    houseName: string;
    intervals: IMagicGamesIntervalDto[];
}

interface IMagicGamesScoreDto {
    id: number;
    name: string;
    timePoints: number;
    marker: number;
}

interface IPunctualityDto {
    id: number;
    name: string;
    start: string;
    stop: string;
    stationId: number;
    stationName: string;
    all: boolean;
}

interface IPunctualityStationDto {
    id: number;
    name: string;
    defaultAll: boolean;
}

interface IPunctualityStatusDto {
    punctuality: IPunctualityDto;
    houses: IPunctualityStatusHouseDto[];
}

interface IPunctualityStatusHouseDto {
    id: number;
    name: string;
    scouts: IPunctualityStatusScoutDto[];
}

interface IPunctualityStatusScoutDto {
    id: number;
    name: string;
    arrived: boolean;
}

interface IPunctualitySwipeDto {
    id: number;
    punctualityId: number;
    rfid: number;
}

interface IQiuzQuestionDto {
    id: number;
}

interface IQiuzSwipeDto {
    id: number;
    questionId: number;
    rfid: number;
}

interface ISchoolScoreDto {
    id: number;
    name: string;
    houses: IHouseScoreDto[];
}

interface IScoutDto {
    id: number;
    rfid: number;
    name: string;
    houseName: string;
    schoolName: string;
    info: string;
}

interface ITeamMemberDto {
    id: number;
    rfid: number;
    name: string;
}

interface ITurnoutSwipeDto {
    name: string;
    data: string;
}

interface ITurnoutPointDto {
    id: number;
    amount: number;
    houseId: number;
    houseName: string;
    time: string;
}

interface IBoxterSwipe {
    id: number;
    swipeId: number;
    scoutId: number;
    scoutName: string;
    houseId: number;
    houseName: string;
    boxId: string;
    boxIdFriendly: string;
    appMode: string;
    appResponse: string;
    createDate: string;
}