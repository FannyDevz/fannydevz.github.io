import axios from "axios";
import hbs from "handlebars";
import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import resume from "./resume_en.json";

const resumeURL = "";

const getGithubApi = (url) => {
  return url.replace("https://github.com/", "https://api.github.com/repos/");
};

const getProjectStars = async (url) => {
  try {
    const api = getGithubApi(url);
    const { data } = await axios.get(api);
    return data.stargazers_count;
  } catch (e) {
    console.error(e);
    return "NaN";
  }
};

export default defineConfig(async ({ command, mode }) => {
  for (const project of resume.projects) {
    if (project.githubUrl)
      project.stars = await getProjectStars(project.githubUrl);
  }
  return {
    plugins: [
      handlebars({
        context: async () => {
          return resume;
        },
        helpers: {
          breaklines: (text) => {
            text = hbs.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, "<br>");
            return new hbs.SafeString(text);
          },
          isNotEmpty: (arr) => {
            return arr.length > 0;
          },
          joinComma: (arr) => {
            return arr.join(", ");
          },
          toSocialIcon: (text) => {
            return {
              linkedin: "ri:linkedin-box-fill",
              github: "ri:github-fill",
              instagram: "ri:instagram-line",
              twitter: "ri:twitter-fill",
              website: "ri:global-line",
              link: "ri:arrow-right-up-line",
              portfolio: "ri:account-circle-fill",
              email: "ri:mail-fill",
              phone: "ri:phone-fill",
            }[text.trim().toLowerCase()];
          },
        },
      }),
    ],
  };
});
