# Authenticating to GitLab with GitHub Desktop

## Creating a Personal Access Token in GitLab

To authenticate against GitLab repositories you will need to create a personal access token.

1. Go to your GitLab account and select **Settings** in the user profile dropdown.

![](https://user-images.githubusercontent.com/721500/54834720-1f468a00-4c97-11e9-9a0f-4c92224064d0.png)

2. Select **Access tokens**

3. Under **Add a personal access token** choose a name and set an expiration date for your token.

4. For **Scopes** select `api` to ensure that GitHub Desktop has the correct read/write access to your GitLab repositories.

5. Click **Create personal access token** to create a new token, and then copy the token to your clipboard.

![](https://user-images.githubusercontent.com/721500/54831880-8feaa800-4c91-11e9-801b-40ed2af869a0.png)

## Cloning your GitLab repository in GitHub Desktop

 1. Open GitHub Desktop and go to **File** > **Clone Repository** > **URL**. Enter the Git URL of your GitLab repository. Make sure you enter the correct URL, which should have the following structure:

      `https://gitlab.com/<username>/<repository>`

 2. You will receive an `Authentication Failed` error. Enter your GitLab username and paste in the token you just copied to your clipboard as your password. Click **Save and Retry** to successfully clone the repository to your local machine in GitHub Desktop.

![](https://user-images.githubusercontent.com/721500/54835396-5f5a3c80-4c98-11e9-9306-df234f8f7abc.png)

   - **Note:** Your GitLab credentials will be securely stored on your local machine so you will not need to repeat this process when cloning another repository from GitLab.
