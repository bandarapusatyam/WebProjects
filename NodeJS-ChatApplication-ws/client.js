	(function(){
		var getNode = function(s){
			return document.querySelector(s);
		}, 
		messages = getNode('.chat-messages'),
		textarea = getNode('.chat textarea'),
		chatName = getNode('.chat-name'),
		users = getNode('.users-list'),
		nameSet = false,
		restResponse = false;
		selectedUser = "All Users"; 

		var ws = new WebSocket('ws://127.0.0.1:8888');

		// process recived message and displays in the chat window.
		// calls rest API for users.
		ws.onmessage = function (event) {
			var message = document.createElement('div');
			message.setAttribute('class', 'chat-message');
			try {
				var data= JSON.parse(event.data);
				if(data.message != undefined){
					//initially setting the nick name to title of the chat window.
					if(!nameSet){
						var raw = data.message.split(' joined.', 2)[0];
						chatName.textContent = raw.split('user: ',2)[1];
						nameSet = true;
					}
					message.textContent = data.from +' : '+data.message;
				} else {
					message.textContent = data.from +' : '+data.error;
				}
        		// rest API for users.
        		restResponse = true;
        		getRestData("users");
        	} catch (e) {
        		// this is for welcome message to display on chat window
        		message.textContent = event.data;
        	}
			//Append
			messages.appendChild(message);
			messages.insertBefore(message, messages.firstChild);
		};

		//listen for keydown event on message type window to post the message to server.
		// enter key for posting and shift+enter for next line.
		textarea.addEventListener('keydown', function(event){
			var self = this,
			name = chatName.value;
			if(event.which === 13 && event.shiftKey === false){
				//socket.emit('inputData', {name: name, message: self.value});
				ws.send(self.value);
				//event.preventDefault();
				textarea.value = '';
			}
		});

		//common method for rest API call to servier. same method for 'users' and 'history' calls.
		getRestData = function(restType){
			var xmlhttp = new XMLHttpRequest();
			var url = "http://127.0.0.1:8888/"+restType;

			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					if(xmlhttp.responseText && restResponse ){
						var restData = JSON.parse(xmlhttp.responseText);
						if(restType === "users"){
							// display users info
							displayUsers(restData.data);
						} else{
							// display chat for selected users.
							displayChat(restData.data);
						}
						// to avoid multiple responses from httpRequests.
						restResponse = false;
					}
				}
			};
			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		}

		// function for displaying the chat history for selected users.
		displayChat = function(data){
			for(var x = 0; x<data.length; x = x + 1){
				if(selectedUser === data[x].from || selectedUser=== "All Users"){
					var message = document.createElement('div');

					message.setAttribute('class', 'chat-message');
					message.textContent = new Date(data[x].timestamp) +' '+data[x].from + ': ' + data[x].msg;

					//Append
					messages.appendChild(message);
					messages.insertBefore(message, messages.firstChild);
					}
				}
			}

			// function for displaying users logged into the server in that session.
			displayUsers = function(data){
				if(data.length){
					users.options.length = 0;
					// to display the Select option list as list view, 
					//need to set at least 2 items.
					users.size = data.length>1?data.length:2;
					var entry = document.createElement('option');
					entry.innerHTML = 'All Users';
					
					users.appendChild(entry);
					for(var y = 0; y<data.length; y = y + 1){
						var entry = document.createElement('option');
						if(data[y].online){
							entry.innerHTML = data[y].nick +' (online)';
						} else {
							entry.innerHTML = data[y].nick +' (offline)';
						}
						users.appendChild(entry);
					}

					// selection event for the users. When this event happens, 
					// calls history rest API and update the selected user chat history. 
					users.addEventListener('change', function(){
						var user = users.options[users.selectedIndex].value.split(' (', 2);
						selectedUser = user[0];
						//clear chat history
						while (messages.hasChildNodes()) {
							messages.removeChild(messages.lastChild);
						}
						// get selected user chat history.
						restResponse = true;
						getRestData("history");

					});
					
				}
			}
		})();

