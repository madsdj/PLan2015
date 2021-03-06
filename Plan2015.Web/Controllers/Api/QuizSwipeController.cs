using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using Plan2015.Data.Entities;
using Plan2015.Dtos;

namespace Plan2015.Web.Controllers.Api
{
    public class QuizSwipeController : ApiControllerWithDB
    {
        public async Task<IHttpActionResult> PostQuizSwipe(QuizSwipeDto dto)
        {
            var scout = await Db.Scouts.FirstOrDefaultAsync(s => s.Rfid == dto.Rfid);
            if (scout == null) return BadRequest("Spejder blev ikke fundet.");

            if (Db.QuizPoints.Where(q => q.HouseId == scout.HouseId)
                .Any(q => q.QuestionId == dto.QuestionId)) return Ok();

            Db.QuizPoints.Add(new QuizPoint
            {
                HouseId = scout.HouseId,
                QuestionId = dto.QuestionId,
            });
            
            await Db.SaveChangesAsync();
            ScoreUpdated();
//
//
//            var punctuality = Db.Punctualities.FirstOrDefault(p => p.Id == dto.PunctualityId);
//            if (punctuality == null) return StatusCode(HttpStatusCode.BadRequest);
//
//            var entity = new PunctualitySwipe
//            {
//                Scout = scout,
//                Punctuality = punctuality,
//                Time = DateTime.Now
//            };
//
//            Db.PunctualitySwipes.Add(entity);
//            await Db.SaveChangesAsync();
//
//            Hub.Clients.Group(punctuality.Id.ToString()).UpdatedStatus(Repository.GetStatus(Db, punctuality.Id));
//
//            if (!Db.PunctualityPoints.Any(pp => pp.HouseId == scout.HouseId && pp.PunctualityId == punctuality.Id))
//            {
//                if (!punctuality.All && punctuality.Start < entity.Time && entity.Time < punctuality.Stop || !await Db.Scouts
//                    .Where(s => s.HouseId == scout.HouseId && !s.Home)
//                    .Except(Db.PunctualitySwipes
//                        .Where(ps =>
//                            ps.Scout.HouseId == scout.HouseId &&
//                            ps.PunctualityId == punctuality.Id
//                            )
//                        .Where(ps => punctuality.Start < ps.Time && ps.Time < punctuality.Stop)
//                        .Select(ps => ps.Scout)
//                        .Distinct())
//                    .AnyAsync())
//                {
//                    var point = new PunctualityPoint
//                    {
//                        House = scout.House,
//                        Punctuality = punctuality
//                    };
//                    Db.PunctualityPoints.Add(point);
//                    await Db.SaveChangesAsync();
//                    ScoreUpdated();
//                }
//            }
            return Ok();
        }
    }
}