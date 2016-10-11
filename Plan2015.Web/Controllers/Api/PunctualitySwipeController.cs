﻿using System;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;
using Plan2015.Data.Entities;
using Plan2015.Dtos;
using Plan2015.Web.Hubs;

namespace Plan2015.Web.Controllers.Api
{
    public class PunctualitySwipeController : ApiControllerWithHub<PunctualityHub,IPunctualityHubClient>
    {
        public async Task<IHttpActionResult> PostPunctualitySwipe(PunctualitySwipeDto dto)
        {
            var scout = Db.Scouts.FirstOrDefault(s => s.Rfid == dto.Rfid);
            if (scout == null) return StatusCode(HttpStatusCode.BadRequest);
            var punctuality = Db.Punctualities.FirstOrDefault(p => p.Id == dto.PunctualityId);
            if (punctuality == null) return StatusCode(HttpStatusCode.BadRequest);

            var entity = new PunctualitySwipe
            {
                Scout = scout,
                Punctuality = punctuality,
                Time = DateTime.Now
            };

            Db.PunctualitySwipes.Add(entity);
            await Db.SaveChangesAsync();

            Hub.Clients.Group(punctuality.Id.ToString()).UpdatedStatus(Repository.GetStatus(Db, punctuality.Id));
            
            if (!Db.PunctualityPoints.Any(pp => pp.HouseId == scout.HouseId && pp.PunctualityId == punctuality.Id))
            {
                if (!punctuality.All && punctuality.Start < entity.Time && entity.Time < punctuality.Stop || !await Db.Scouts
                    .Where(s => s.HouseId == scout.HouseId && !s.Home)
                    .Except(Db.PunctualitySwipes
                        .Where(ps =>
                            ps.Scout.HouseId == scout.HouseId &&
                            ps.PunctualityId == punctuality.Id
                            )
                        .Where(ps => punctuality.Start < ps.Time && ps.Time < punctuality.Stop)
                        .Select(ps => ps.Scout)
                        .Distinct())
                    .AnyAsync())
                {
                    var point = new PunctualityPoint
                    {
                        House = scout.House,
                        Punctuality = punctuality
                    };
                    Db.PunctualityPoints.Add(point);
                    await Db.SaveChangesAsync();
                    ScoreUpdated();
                }
            }
            return Ok();
        }
    }
}