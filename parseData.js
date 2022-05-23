// import { json } from "body-parser";

/**
 * These will be all of the global variables needed here
 */
 var stimulus_dict = new Map();
 var participant_info = new Map();

 /**
  *Function to remove any common non-alphanumeric characters from a string
    *@param {string} str is the string to be cleaned
    *@return {string} the cleaned string
*/
function cleanString(str){
    return str.replace(/[.,\/#"!$%\^&\*;:{}='\-_`~()]/g,"").replace(/\s{2,}/g, "");
}

 /**
  * 
  * @param {*} data will be the json that results from the completion of the survey 
  */
 function parseData(data){
     //parse the information from the form (this all pertains to one individual)
     parseParticipantInfo(data, participant_info);
     //parse information from all of the stimulus trials
     buildStimulusDict(data, stimulus_dict);
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
    
     //construct row messages
     var id = cleanString(participant_info["turkID"]);
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

     return [stimulus_query, participants_query];
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
         message+= (cleanString(stimulus) + "', ")
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
             message += ("'" + cleanString(arr[item]) + "', ");
         }
         //trim end of message to correct
         message = message.substring(0, message.length-2);
         message += ")";
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
             //stimulus --> speed, response time, vignette name
             dict[unit.stimulus] = [unit.speed, unit.rt, unit.vignette];
         }
     });
 }

 export default makeQuery;