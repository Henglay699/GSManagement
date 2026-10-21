namespace GSManagement.Api.Shared.Storage;

public class R2Options
{
    public const string SectionName = "CloudflareR2";

    public string AccountId { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;

    // Public base URL of the bucket: the r2.dev URL or a custom domain,
    // e.g. https://pub-xxxx.r2.dev or https://files.example.com
    public string PublicBaseUrl { get; set; } = string.Empty;
}
