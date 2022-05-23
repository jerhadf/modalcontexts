// import { json } from "body-parser";

// I want to store the mapping of a particular stimulus to the modal type, response time, and vignette name

// it should be made clear: replace(/[.,\/#"!$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g," ") 
// this function will simply remove any common non-alphanumeric characters from a string; this is important because json parsing is some ass. 

/**
 * These will be all of the global variables needed here
 */
 var stimulus_dict = new Map();
 var participant_info = new Map();
 var crt_info = [];
 var bdi_info = [];
 var bai_info = [];
 /**
  * 
  * @param {*} data will be the json that results from the completion of the survey 
  */
 function parseData(data){
     //parse the information from the form (this all pertains to one individual)
     parseParticipantInfo(data, participant_info);
     //parse information from all of the stimulus trials
     buildStimulusDict(data, stimulus_dict);
     //parse infromation from bdi/bai/crt
     parseMetrics(data, crt_info, bai_info, bdi_info);
 }
 /**
  * 
  * @param {*} data -- the json that results from the completion of the survey 
  */
 function makeQuery(data) {
     //need to build the dictionaries
     parseData(data);
     // Query format for stimulus table: "INSERT INTO stimulus_table" + "(column1, column2, column3,...,column)" + " " + "VALUES " + "valuesStr" + ";")
     var stimulus_column_names = "(stimulus, answer, event_type, reaction_time, vignette_name, turkID)";
     //ordering of participant column names 
     var participants_column_names = "(age, handedness, language, nationality, country, gender, education, turkID)";
     var measures_column_names = "(measure, turkID, responses)";
     //construct row messages
     var id = participant_info["turkID"].replace(/[.,\/#"!$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g," ");
     var messages = "";
     for (var key in stimulus_dict){
         var message = createMessage(key, stimulus_dict[key], id, "stimulus");
         messages += message+", ";
     }
     messages = messages.substring(0, messages.length -2);
     var stimulus_query = "INSERT INTO stimulus_table " + stimulus_column_names + " " + "VALUES " + messages + ";";
 
     //inserting into the table that will contain participants 
     var participants_message = createMessage(null, participant_info, id, "participants");
     var participants_query = "INSERT INTO participant_table " + participants_column_names + " " + "VALUES " + participants_message + ";";
    
 
     //inserting into the table that will contain crt/bdi/bai 
     var crt_message = createMessage(null, crt_info, id, "crt");
     var crt_query = "INSERT INTO measures_table " + measures_column_names + " " + "VALUES " + crt_message + ";";
     
     var bdi_message = createMessage(null, bdi_info, id, "bdi");
     var bdi_query = "INSERT INTO measures_table " + measures_column_names + " " + "VALUES " + bdi_message + ";";
 
     var bai_message = createMessage(null, bai_info, id, "bai");
     var bai_query = "INSERT INTO measures_table " + measures_column_names + " " + "VALUES " + bai_message + ";";
 
     return [stimulus_query, participants_query, crt_query, bdi_query, bai_query];
 }
 /**
  * 
  * @param {*} arr is the array/map that stores the relavent data
  * @param {*} id is the participant turkID
  * @param {*} type is the type of query we want to make (i.e. stimulus, participants, crt)
  * @param {*} stimulus is the stimulus in the case of the type being stimulus
  * @returns the message that will suceed "VALUES" in the sql insert paradigm
  */
 function createMessage(stimulus,arr, id, type){
     if (type == "stimulus"){
         arr.push(id);
         var message = "('"
         message+= (stimulus.replace(/[.,\/#"!$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g," ")+"', ")
         for (var item of arr){
             message+= ("'"+item+"', ")
         }
         //trim end of message to correct
         message = message.substring(0, message.length-2);
         message += ")";
         return message;
     }
     else if (type == "participants"){
         var message = "("
         for (var item in arr){
             message+= ("'"+arr[item].replace(/[.,\/#"!$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g," ")+"', ")
         }
         //trim end of message to correct
         message = message.substring(0, message.length-2);
         message += ")";
         return message;
     }
     //for the following measures, instead of splitting each question in the survey by ",", I split by "|"
     else if (type == "crt"){
         var message = "("
         message += ("'crt', '" + id +"', '");
         for (var item of arr){
             message += item+"|";
         }
         message+="' ";
         //trim end of message
         message = message.substring(0, message.length -1) + ")";
         return message;  
     }
     else if (type == "bdi"){
         var message = "("
         message += ("'bdi', '" + id +"', '");
         for (var item of arr){
             message += item+"|";
         }
         message+="' ";
         //trim end of message
         message = message.substring(0, message.length -1) + ")";
         return message; 
     }
     else if (type == "bai"){
         var message = "("
         message += ("'bai', '" + id +"', '");
         for (item of arr){
             message += item+"|";
         }
         message+="' ";
         //trim end of message
         message = message.substring(0, message.length -1) + ")";
         return message; 
     }
 }
 /**
  * 
  * @param {*} data is the json file that is sent from the completed survey
  * @param {*} dict is the participant_info dictionary that is built inside this method
  */
 function parseParticipantInfo(data, dict){
     data.forEach( (unit) => {
         var ordering = ["age", "handedness", "language", "nationality", "country", "gender", "education", "turkID"];
         if(unit.internal_type == "participant_info"){
             var responses = unit.responses.split(",");
             for(var i = 0; i < responses.length; i++){
                 //this will give us the "Q0":"11" as two indicies
                 var response = responses[i].split(":");            
                 //general way to parse number from string
                 //for whatever reason, response[1].match(/\d+/) == null
                 var number = response[1];
              
                 dict[ordering[i]] = number;
             }
             return null;
         }
     });
 }
 
 /**
  * 
  * @param {*} data is the json file that is sent from the completed survey
  * @param {*} dict is the stimulus_dict dictionary that is built inside this method
  */
 function buildStimulusDict(data, dict){
     data.forEach( (unit) => {
         if(unit.internal_type == "stimulus"){
             //stimulus --> modal_type, speed, response time, vignette name
             dict[unit.stimulus] = [unit.modal_type, unit.speed, unit.rt, unit.vignette];
         }
     });
 }
 /**
  * 
  * @param {*} data is the json file that is sent from the completed survey
  * @param {*} crt is the array that will store the crt answers
  * @param {*} bai is the array that will store the bai answers
  * @param {*} bdi is the array that will store the bdi answers
  */
 function parseMetrics(data, crt, bai, bdi){
     data.forEach( (unit) => {
         if(unit.internal_type == "crt"){
             var responses = unit.responses.split(",");
             for (var i = 0; i < responses.length; i++){
                 var response = responses[i].split(":");
                 //processing out the characters and such, which is very important later on (just add the character you want to remove)
                 response = response[1].replace(/[.,\/#"!$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g," ");
                 crt.push(response.substring(1,response.length -1));
             }
         }
         if(unit.internal_type == "bai"){
             var responses = unit.responses.split(",");
             for (var i = 0; i < responses.length; i++){
                 var response = responses[i].split(":");
                 //processing out the characters and such 
                 response = response[1].replace(/[.,\/#!"$%\^&\*;:{}='’\-_`~()]/g,"").replace(/\s{2,}/g," ");
                 bai.push(response.substring(1,response.length -1));
             }
         }
         if (unit.internal_type == "bdi"){
             var responses = unit.responses.split(",");
             for (var i = 0; i < responses.length; i++){
                 var response = responses[i].split(":");
                 //processing out the characters and such
                 response = response[1].replace(/[.,\/#!"$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g," ");
                 bdi.push(response.substring(1,response.length -1));
             }
         }
     });
 }
 export default makeQuery;