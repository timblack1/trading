// PURPOSE: Display a smart order's current profit or loss

// USAGE:
// - Install this in Chrome DevTools' Sources > Snippets
// - Configure the order numbers to track below, and their entry values
// - Run it on a TradePartner Smart Order page like https://tradepartner.io/trading/smart-orders/71994

// NOTES
// - The orders' entry cost and tracking status is stored in localStorage to persist between page reloads.
// - The data for each smart order page (URL) is stored separately, so this script can run for multiple
//   smart orders (on multiple pages) simultaneously.
// - The script raises a browser notification when the trade turns profitable.

// Write new order data to localStorage
// Event occurs on the checkbox or text input
function writeOrdersToLocalStorage (event) {
  // Get any existing orders from localStorage, so we can insert the new into the existing data
  const storedOrdersString = localStorage.getItem(window.location.pathname)
  var storedOrders = []
  if (storedOrdersString !== null) {
    storedOrders = JSON.parse(storedOrdersString)
  }
  storedOrders[event.target.dataset.id] = {
    id: event.target.dataset.id,
    entryValue: event.target.parentNode.querySelector('input[type="text"]').value,
    selected: event.target.parentNode.querySelector('input[type="checkbox"]').checked
  }
  localStorage.setItem(window.location.pathname, JSON.stringify(storedOrders))
}

// Get the order data stored in localStorage if they exist there for this URL
const storedOrdersString = localStorage.getItem(window.location.pathname)
var storedOrders = []
if (storedOrdersString === null) {
  // Create the localStorage data store, initialized with an empty array
  localStorage.setItem(window.location.pathname, JSON.stringify(storedOrders))
} else {
  storedOrders = JSON.parse(storedOrdersString)
}

const ordersOnPageInverseElements = Array.from(document.querySelectorAll('i[title="Duplicate Inverse"]'))

if (storedOrders.length !== ordersOnPageInverseElements.length) {
  // Notify the user
  alert('The number of orders on the page has changed.  If you have deleted an order, please adjust the order selections and entry values accordingly.')
}

// For each order on the page
window.ordersOnPage = ordersOnPageInverseElements
.map((element, index) => {
  const orderElement = element.parentNode
  const id = index + 1
  
  // Create a checkbox to select each order whose profit the user wants to calculate
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.dataset.id = id
  checkbox.title = "Track this order's profit?"
  checkbox.style.cssText = 'margin-left: 0.75em;'
  checkbox.addEventListener('change', writeOrdersToLocalStorage)
  orderElement.appendChild(checkbox)

  // Create an entry value input on the page
  const textInput = document.createElement('input')
  textInput.type = 'text'
  textInput.dataset.id = id
  textInput.placeholder = 'Entry'
  textInput.title = "Please supply this order's entry cost. A negative entry value equals a credit."
  textInput.style.cssText = 'margin-left: 0.3em; width: 3em; font-size: 0.75em; position: relative; top: -2px;'
  textInput.addEventListener('change', writeOrdersToLocalStorage)
  orderElement.appendChild(textInput)

  // Sync storedOrders with ordersOnPage
  const order = storedOrders[id]
  if (typeof order !== 'undefined') {
    // The order exists in storage, so populate the inputs with stored data
    checkbox.checked = order.selected
    textInput.value = order.entryValue
  } else {
    // The order does not exist in storage, so create it there
    storedOrders[id] = {
      id: id,
      entryValue: textInput.value,
      selected: checkbox.checked
    }
    localStorage.setItem(window.location.pathname, JSON.stringify(storedOrders))
  }

  // Store references to each order's inputs
  return {
    id: index + 1,
    checkbox: checkbox,
    textInput: textInput
  }
})

// Set up global variables
window.profitOrLoss = 'loss'
window.userAcknowledgedNotification = true

// Create scroller element to display output
const scrollerElement = document.createElement('div')
scrollerElement.style.cssText = `overflow: scroll; height: 20rem;`
document.body.prepend(scrollerElement)

// Get order's current value from the page
function getOrderCurrentValue (id) {
    return parseFloat(Array.from(document.querySelectorAll('h4'))
        .filter(el => el.textContent.indexOf(`Order ${id}`) !== -1)[0]
        .parentNode.parentNode.querySelector('b').textContent
        .split('$')[1])
}

// Calculate the trade's balance
function calculateTradeBalance () {
    
    // Negative equals a net credit on exit, which means a profit
    const exitTotal = window.ordersOnPage
    // Only calculate the balance for orders the user has selected
    .filter(order => order.checkbox.checked)
    .map(order => {
        const currentValue = getOrderCurrentValue(order.id)
        // Return the current balance for this order
        return currentValue - order.textInput.value
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

// When script is run
askNotificationPermission()

// Every few seconds
setInterval(calculateTradeBalance, 10000)

