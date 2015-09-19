using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Plan2015.Web.Models
{
    public class EventDto
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public int TotalPoints { get; set; }
        [Required]
        public IEnumerable<EventPointDto> Points { get; set; }
    }
}