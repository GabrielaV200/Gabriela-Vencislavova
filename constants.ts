export const SYSTEM_INSTRUCTION = `You are an intelligent job search automation assistant. Your role is to help users land their dream job by automating the job search process. You analyze job descriptions, tailor resumes and cover letters, and provide strategic advice.

Your tasks include:
- Extracting key skills and requirements from job descriptions.
- Rewriting resumes to match specific job postings using ATS-friendly language.
- Generating personalized cover letters.
- Suggesting follow-up strategies and interview preparation tips.
- Learning from user feedback to improve future applications.

You respond with clear, concise, and actionable outputs formatted in Markdown. You always aim to save the user time and increase their chances of success.`;

export const RESUME_TAILOR_PROMPT = (jobDescription: string, resume: string) => `
Job Description:
---
${jobDescription}
---

Existing Resume:
---
${resume}
---

Based on the job description and existing resume provided above, please generate a tailored resume. The tailored resume should highlight the skills and experiences that directly match the job requirements. Use strong action verbs and format it professionally in Markdown. Ensure it is optimized for Applicant Tracking Systems (ATS) by including relevant keywords from the job description.
`;

export const SKILLS_EXTRACTOR_PROMPT = (jobDescription: string) => `
Analyze the following job description and extract the key skills, qualifications, and requirements. Organize them into clear categories such as 'Technical Skills', 'Soft Skills', 'Required Experience', and 'Education'. Present the output in Markdown format with clear headings and bullet points.

Job Description:
---
${jobDescription}
---
`;

export const COVER_LETTER_PROMPT = (jobDescription: string, resume: string) => `
Job Description:
---
${jobDescription}
---

My Resume:
---
${resume}
---

Based on the job description and my resume provided above, please write a professional and personalized cover letter. The cover letter should:
1.  Address the hiring manager if possible (otherwise use a general salutation).
2.  Start with a strong opening paragraph that grabs attention and states the position I'm applying for.
3.  Highlight 2-3 of my most relevant skills and experiences from my resume that match the key requirements in the job description. Provide specific examples or achievements.
4.  Show genuine interest in the company and the role.
5.  End with a strong closing paragraph that reiterates my interest and includes a call to action.
6.  Be formatted professionally in Markdown.
`;

export const JOB_MATCHER_PROMPT = (resume: string, jobTitle: string, preferences: string) => `
Act as an expert AI job search agent. Based on the user's resume and their stated job preferences, generate a list of 3 to 5 realistic but fictional job postings that would be an excellent match.

For each job posting, provide:
- A job title
- A well-known company name
- A location
- A short, compelling summary of the role (2-3 sentences) including key responsibilities and required qualifications.

The goal is to provide the user with high-quality, relevant job opportunities they can use to prepare their application materials. Format the entire output in Markdown, with each job posting clearly separated.

User's Resume:
---
${resume}
---

Desired Job Title:
---
${jobTitle}
---

Other Preferences (e.g., location, industry, remote):
---
${preferences}
---
`;