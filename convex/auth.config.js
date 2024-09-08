export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
    {
      name: "github",
      clientID: process.env.GITHUB_SITE_URL,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  ],
};
