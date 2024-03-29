# modal-contexts

This repo is an experiment to test the effects of context and familiarity on modal cognition, based on a template for COGS department surveys. 

The full plan for the study is described in this google doc - [Context Effects in Modal Cognition](https://docs.google.com/document/d/1z_zoXk1P6Jm-k4ru9d96hQRTARmhRbVpGOIT1jqeA1M/edit?usp=sharing). The experiment website is running at this link: https://modal-contexts.herokuapp.com/. The app is set up using my personal Heroku account, email me at jeremy.hadfield.th@dartmouth.edu to change that.


## Project Description 

This project aims to understand how context affects how we represent and reason about alternative possibilities. Previous research in modal cognition has shown that across many domains, people use a similar process to rapidly and reliably generate alternative possibilities for a given situation or action. A common representation impacts which alternatives are considered most relevant, where the morality, probability, and normality of the possibilities are key factors. A modal space is the set of relevant possibilities in a context. Existing work has not determined how situational factors impact this process and influence which possibilities come to mind first. Some contexts may promote more deliberative reasoning about possibilities, while other domains encourage fast heuristics. To determine the impact of context on modal cognition, a sample of participants will rate a series of situations on various scales: how familiar they are with this type of situation, its normality or typicality, its emotional valence and intensity, and how morally charged it is. Then, both this group and another sample will generate a brief list of alternative possibilities for each situation. The resulting data will be used to identify correlations between the situations and the resulting set of possibilities. Finally, a statistical model will be created to predict the set of relevant possibilities based on variation in contextual factors. 

## Stack
Instead of a single html page, this repo works as a Node.js Express server to
1) Serve the html page with JsPsych
2) Receive data and securely write it to the database

The reason for doing this is security. With client-side database writing (php scripts called by JsPsych), the database credentials are exposed to the user. As such, all survey data could be exposed to any user. By insulating the database writing and running it on a server, rather than client-side, the database is protected. 



This repo is designed for deployment to AWS Elastic Beanstalk deployment for Node.js apps. 

## Requirements

### Development

To develop this code, you must have minimal Javascript dev experience
 - Node.js installed, version >= 12. Download at https://nodejs.org/en/download/
 - Yarn installed, download most recent version at https://classic.yarnpkg.com/en/docs/install/#mac-stable
 - Git for the command line https://git-scm.com/downloads

### Deployment 
 - Install the EC CLI (Elastic Beanstalk Command Line Interface) https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html
    - More instructions found here https://github.com/aws/aws-elastic-beanpython ./aws-elastic-beanstalk-cli-setup/scripts/ebcli_installer.pystalk-cli-setup
    - This is tricky, on Mac make sure your Xcode Command Line Tools are installed https://www.embarcadero.com/starthere/xe5/mobdevsetup/ios/en/installing_the_commandline_tools.html
 
 ## Startup
 
 NOTE: Do not clone and edit this repo, instead follow these instructions. 
 1) Create a new github repository, clone it to your machine
 2) Add this template as a git remote with `git remote add template https://github.com/nathan-m-schneider-22/psych-survey.git`
 3) Pull the template code into your repo with `git pull template main --allow-unrelated-histories`
 4) Locally install the necessary packages with `yarn`
 5) Add your `.env` file to the top-level-directory, which contains the database login credentials, in the form of 
 ```
DBUSER=phillab
PASSWORD=gyubin974hf08nc
HOST=consideration-sets.cfahjwyzytn4.us-east-2.rds.amazonaws.com
DATABASE=consideration
```
 6) To run the server, run `yarn start`. You should see 
 ```
 listening on: 9090
Connected to database!
```
7) To see the page navigate to http://localhost:9090 

Once the server is up and running, you can edit the files, see below for code methodology. 

## Code Methodology
This repo, if used correctly allows for quick development and deployment of database-writing JsPsych surveys. Below is an overview of the files 
 - [server.js](server.js) Main code for managing the the sending of files and receiving information. Only edit if you need to alter the flow of 
    1) Server gives client survey
    2) Client POST server the survey data
 - [public/index.html](public/index.html) This is your main file for writing JsPsych surveys. The current version contains the necessary parts for sending data
 ```
     jsPsych.init({
        timeline,
        on_finish: function() {
            jsPsych.data.displayData();
            save_data(jsPsych.data.get().values());
        }
    })
```
This runs the timeline, then save_data sends it to the server. 
```    
function save_data(data) {
        url = location+"data"
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            data
        }));
    }
```
 - [public/custom_package.js](public/custom_package.js) Any extra code you need for the survey can be placed here and run. 
 - [parseData.js](parseData.js) This file is for processing the raw JSON data send from the survey, and returning a single SQL query for inserting the necessary values. See https://www.sqlservertutorial.net/sql-server-basics/sql-server-insert-multiple-rows/ fSetup the environment with or more info 
 ## Running Locally
 To run the code locally, start the server with `yarn start`. Once running, navigate to http://localhost:9090 to take the survey, and test locally. You can log information with `console.log()`. 
 
 To test your parsing and query constructing without having to take the survey many times:
 1) Start the server with `yarn start` and navigate to http://localhost:9090 with Google Chrome
 2) Right click and click "Inspect" to view the Chrome debug menu, and navigate to the "Network" tab
 3) Complete your survey with the tab open, then once finished look for the request to the server, it should look like this:
 ![request](https://user-images.githubusercontent.com/48935297/99119236-e32c0f80-25c6-11eb-8500-2883708f06cb.png)
 4) Scroll down and click `show source`, then copy the data. 
 ![source](https://user-images.githubusercontent.com/48935297/99119666-8c730580-25c7-11eb-8080-5b7926616ba9.png)
![copy](https://user-images.githubusercontent.com/48935297/99119674-8da43280-25c7-11eb-950b-ce838329f7e8.png)

 5) Replace the content of `testData.json` with the data you copied. 
 6) Once you've updated `testData.json`, you can re-send that data to the server (as if you've just completed the survey) with this command :
 
 ```
 curl -vX POST http://localhost:9090/data -d @testData.json --header "Content-Type: application/json"
 ```
 Use this to test the data parsing and database writing. Any `console.log()`s or errors will be shown in the server console. 
 
 
 
 ## Deployment
 Once you have installed the EB CLI, (contact me if having trouble with that), follow these steps to deploy it to AWS. This process follows [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs_express.html) approach. 
 
 0) You may have to login with your AWS secret keys, find them [here](https://console.aws.amazon.com/iam/home?region=us-east-2#/security_credentials)
 1) Initialize with `eb init --platform node.js --region us-east-2`
 2) Setup the environment with `eb create --sample node-express-env`, wait several minutes for this to finish
 3) Deploy to the environment with `eb deploy`
 4) You will still be unable to view to page, as you have not added the environment variables. To add them go to 
   - AWS Elastic Beanstalk Dashboard online
   - Go to the node-express-env environment
   - Navigate to Configuration, then Software, then Environment properties
   - Enter each variable from your `.env` file, it should look like this:
   - <img width="1076" alt="Screen Shot 2020-11-09 at 5 04 50 PM" src="https://user-images.githubusercontent.com/48935297/98601973-c1bce200-22ad-11eb-9f2d-ca81a42fe400.png">
  5) Once the environment updates, go back and enter `eb open` to view the app. This URL is now accessible everywhere, and can be configured in AWS settings. 
  6) After making changes to the code, commit your changes, then `eb deploy` to deploy them. View the survey with `eb open`. 

  Use Seroku - not linode. 
