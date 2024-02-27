document.addEventListener('DOMContentLoaded', function() {

  // Mobile hamburger menu
  document.querySelector('.hamburger').addEventListener('click', mobile_menu);

  // Use buttons to toggle between views
  document.querySelectorAll('#inbox').forEach(sent => {
    sent.addEventListener('click', () => {
      load_mailbox('inbox');
      mobile_menu();
    });
  });
  document.querySelectorAll('#sent').forEach(sent => {
    sent.addEventListener('click', () => {
      load_mailbox('sent');
      mobile_menu();
    });
  });
  document.querySelectorAll('#archived').forEach(sent => {
    sent.addEventListener('click', () => {
      load_mailbox('archive');
      mobile_menu();
    });
  });
  document.querySelectorAll('#compose').forEach(sent => {
    sent.addEventListener('click', () => {
      compose_email();
      mobile_menu();
    });
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function mobile_menu() {
  if (window.innerWidth < 900) {
    document.querySelector('.navbar').classList.toggle('displayed');
    document.querySelector('.navbar').classList.toggle('visible');
    document.querySelector('.hamburger').classList.toggle('opened');
  }
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#content-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Wait for mail to be sent
  document.querySelector('form').onsubmit = () => {
    if (document.querySelector('#compose-recipients').value === '') {
      return false;
    } 
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => {
      console.log(response);
      console.log(response.status);
      if (response.status === 201) {
        load_mailbox('sent')
      } else {
        return false;
      }
    });
    return false;
  }
}

function load_mailbox(mailbox) {

  // Clear emails-view
  document.querySelector('#emails-view').innerHTML = '';

  // Load emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      emails.forEach(email => {

        // Create div for each mail
        const mail = document.createElement('div');
        email.read ? mail.setAttribute('class', 'mail read') : mail.setAttribute('class', 'mail unread'); 

        // Create div for sender, subject, date
        const sender = document.createElement('div');
        sender.setAttribute('class', 'sender');
        sender.innerHTML = email.sender;
        const subject = document.createElement('div');
        subject.setAttribute('class', 'subject');
        subject.innerHTML = email.subject;
        const body = document.createElement('div');
        body.setAttribute('class', 'body');
        body.innerHTML = email.body;
        const date = document.createElement('div');
        date.setAttribute('class', 'date');
        date.innerHTML = email.timestamp;

        // Add all divs to mail div
        mail.appendChild(sender);
        mail.appendChild(subject);
        mail.appendChild(body);
        mail.appendChild(date);

        // Wait for click on email
        mail.addEventListener('click', () => load_email(email.id));
                
        document.querySelector('#emails-view').appendChild(mail)
      });
  });

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function load_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    const content = document.querySelector('#content-view');
    content.innerHTML = '';

    // Create buttons
    const buttons = document.createElement('div');
    buttons.setAttribute('class', 'buttons');

    const reply = document.createElement('button');
    reply.setAttribute('class', 'reply');
    reply.innerHTML = 'Reply';
    reply.addEventListener('click', () => {
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      if (email.subject[0] === 'R' && email.subject[1] === 'e' && email.subject[2] === ':') {
        document.querySelector('#compose-subject').value = email.subject;
      } else {
        document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
      };
      document.querySelector('#compose-body').value = `\n\n\nOn ${email.timestamp}, ${email.sender} wrote: \n\n ${email.body}`;
    });

    const archivebut = document.createElement('button');
    if (email.sender != document.querySelector('.usermail').innerHTML) {
      if (email.archived) {
        archivebut.setAttribute('class', 'archived');
        archivebut.innerHTML = 'Unarchive';
        archivebut.addEventListener('click', () => {
          unarchive(email.id);
        });
      } else {
        archivebut.setAttribute('class', 'notarchived');
        archivebut.innerHTML = 'Archive';
        archivebut.addEventListener('click', () => {
          archive(email.id);
        });
      }
      buttons.appendChild(reply);
      buttons.appendChild(archivebut);
    } else {
      buttons.append(reply);
    }

    // Create div for sender, subject, date
    const sender = document.createElement('div');
    sender.setAttribute('class', 'sender');
    sender.innerHTML = 'From: ' + email.sender;
    const recipients = document.createElement('div');
    recipients.setAttribute('class', 'recipients')
    recipients.innerHTML = 'To: ' + email.recipients;
    const subject = document.createElement('div');
    subject.setAttribute('class', 'subject');
    subject.innerHTML = 'Subject: ' + email.subject;
    const body = document.createElement('div');
    body.setAttribute('class', 'body');
    body.innerHTML = email.body;
    const date = document.createElement('div');
    date.setAttribute('class', 'date');
    date.innerHTML = email.timestamp;

    content.append(buttons, sender, recipients, subject, date, body);

    // Request to change mail to read = True
    if (email.sender != document.querySelector('.usermail').innerHTML && email.read === false) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }
  })
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'block';
}

function archive(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  .then(response => {
    if (response.status === 204) {
      load_mailbox('inbox');
    }
  });
}

function unarchive(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  .then(response => {
    if (response.status === 204) {
      load_mailbox('inbox');
    }
  });
}
