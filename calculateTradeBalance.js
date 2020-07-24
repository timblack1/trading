// PURPOSE: Display a smart order's current profit or loss

// USAGE:
// - Install this in Chrome DevTools' Sources > Snippets
// - Configure the order numbers to track below, and their entry values
// - Run it on a TradePartner Smart Order page like https://tradepartner.io/trading/smart-orders/71994

// ----- BEGIN CONFIGURE THESE VALUES -------

// Negative entry value equals a credit
window.ordersToTrack = [
    { number: 1, entryValue: -1.78 },
    { number: 2, entryValue: 1.58 }
]

// ----- END CONFIGURE THESE VALUES -------

// Set up global variables
window.profitOrLoss = 'loss'
window.userAcknowledgedNotification = true

// Create scroller element to display output
const scrollerElement = document.createElement('div')
scrollerElement.style.cssText = 'overflow: scroll; height: 20rem;'
document.body.prepend(scrollerElement)

// Get order's current value from the page
function getOrderCurrentValue (orderNumber) {
    return parseFloat(Array.from(document.querySelectorAll('h4'))
        .filter(el => el.textContent.indexOf(`Order ${orderNumber}`) !== -1)[0]
        .parentNode.parentNode.querySelector('b').textContent
        .split('$')[1])
}

// Calculate the trade's balance
function calculateTradeBalance () {
    
    // Negative equals a net credit on exit, which means a profit
    const exitTotal = window.ordersToTrack.map(order => {
        const currentValue = getOrderCurrentValue(order.number)
        // Return the current balance for this order
        return currentValue - order.entryValue
    })
    .reduce((accumulator, currentValue) => accumulator + currentValue) * 100

    const oldProfitOrLoss = window.profitOrLoss

    window.profitOrLoss = exitTotal > 0
        ? 'profit'
        : 'loss'

    if (oldProfitOrLoss === 'loss' && window.profitOrLoss === 'profit' && window.userAcknowledgedNotification === true) {
        // Notify the user that the trade has turned profitable
        const message = 'This trade turned profitable!'
        // Create window manager-level notification
        var notification = new Notification(message, {
          body: `Current profit: $${exitTotal.toFixed(2)}`,
          // Make the notification replace any previous notifications sent from this same smart order
          tag: window.location.href
        });
        // When the user clicks the notification, focus the tab which sent the notification
        notification.addEventListener('click', event => {
          parent.focus();
          window.focus();
        })
        // Do not send multiple copies of this notification
        window.userAcknowledgedNotification = false
        // TODO: Is it a problem for TradePartner functionality that this blocks the browser's
        // JavaScript execution?
        // window.userAcknowledgedNotification = window.confirm(message)
    }

    const outputMessage = `Current ${window.profitOrLoss}: $${exitTotal.toFixed(2)}`

    // Prepend output to the scroller
    const div = document.createElement('div')
    div.style.cssText = `color: ${window.profitOrLoss === 'profit' ? 'green' : 'red'};`
    div.innerHTML = outputMessage
    scrollerElement.prepend(div)

}

// Get the user's permission to display notifications
function askNotificationPermission() {
  // Function to actually ask the permissions
  function handlePermission(permission) {
    // Whatever the user answers, we make sure Chrome stores the information
    if(!('permission' in Notification)) {
      Notification.permission = permission;
    }
  }

  Notification.requestPermission()
  .then((permission) => {
    handlePermission(permission);
  })
}

// Call main methods

// On page load
askNotificationPermission()

// Every few seconds
setInterval(calculateTradeBalance, 10000)

