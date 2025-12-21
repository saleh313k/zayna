using System.Threading.Tasks;

namespace ZAYNA.Core.Interfaces
{
    public interface ISMSService
    {
        // Infrastructure expects SendSMSAsync
        Task SendSMSAsync(string phoneNumber, string message);
    }
}
