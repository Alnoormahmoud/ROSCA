using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.DTOs.Users
{
    public class IntegrityProfileDTO
    {
        public int TotalRequired { get; set; }
        public int TotalPaid { get; set; }
        public int OnTimePayments { get; set; }
        public int LatePaymentsCount { get; set; }
        public int MissingPayments { get; set; }
        public double CommitmentRate { get; set; }
        public double  RawScore { get; set; }
        public string Level { get; set; } = string.Empty;
    }
}
