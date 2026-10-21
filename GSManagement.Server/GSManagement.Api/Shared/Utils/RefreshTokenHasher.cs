using System.Security.Cryptography;
using System.Text;

namespace GSManagement.Api.Shared.Utils
{
    public class RefreshTokenHasher
    {
        public static string Hash(string refreshToken)
           => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
    }
}
