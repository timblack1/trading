// USAGE:
// - Install this in Chrome DevTools' Sources > Snippets
// - Configure the entry values below
// - Configure the CSS selectors to point to your bullish and bearish trade values on the page
// - Run it on a TradePartner Smart Order page like https://tradepartner.io/trading/smart-orders/71994

// Negative equals a credit on entry
window.bullishEntryValue = 0.6
window.bearishEntryValue = -1

window.profitOrLoss = 'loss'
window.userAcknowledgedNotification = true

const scrollerElement = document.createElement('div')
scrollerElement.style.cssText = 'overflow: scroll; height: 20rem;'
document.body.prepend(scrollerElement)

function calculateTradeBalance () {
    
    const bullishCurrentValue = document.querySelector("#sosystem > section.col-sm-6.order-section > div:nth-child(7) > div > div > div.panel-heading > div > div:nth-child(2) > span > b").textContent.split('$')[1]
    const bearishCurrentValue = document.querySelector("#sosystem > section.col-sm-6.order-section > div:nth-child(6) > div > div > div.panel-heading > div > div:nth-child(2) > span > b").textContent.split('$')[1]

    // Negative equals a net credit on exit, which means a profit

    const bullishTotal = bullishCurrentValue - window.bullishEntryValue
    const bearishTotal = bearishCurrentValue - window.bearishEntryValue

    const exitTotal = (bullishTotal + bearishTotal) * 100

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