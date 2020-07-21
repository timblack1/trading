// PURPOSE: Display a smart order's current profit or loss

// USAGE:
// - Install this in Chrome DevTools' Sources > Snippets
// - Configure the order numbers to track below, and their entry values
// - Run it on a TradePartner Smart Order page like https://tradepartner.io/trading/smart-orders/71994

// Negative entry value equals a credit
window.ordersToTrack = [
    { number: 3, entryValue: -1 },
    { number: 4, entryValue: 0.6 }
]

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
        // Do not send multiple copies of this notification
        window.userAcknowledgedNotification = false
        // Notify the user that the trade has turned profitable
        window.userAcknowledgedNotification = window.confirm('This trade has just turned profitable, so you may want to exit it soon!')
    }

    const outputMessage = `Current ${window.profitOrLoss}: $${exitTotal.toFixed(2)}`

    // Prepend output to the scroller
    const div = document.createElement('div')
    div.innerHTML = outputMessage
    scrollerElement.prepend(div)

}

setInterval(calculateTradeBalance, 10000)
