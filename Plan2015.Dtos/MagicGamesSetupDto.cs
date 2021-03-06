using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Plan2015.Dtos
{
    public class MagicGamesSetupDto
    {
        [Required]
        public int HouseId { get; set; }
        [Required]
        public string HouseName { get; set; }
        [Required]
        public IEnumerable<MagicGamesIntervalDto> Intervals { get; set; }
    }
}