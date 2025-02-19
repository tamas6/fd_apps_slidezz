import Reveal from 'reveal.js'

import { HistoryAction, HistoryActionType } from '../store'
import { youtubeUrlParser } from '../utils'

export async function addEmbedVideoToCurrentSlide(
  url: string,
  deck: Reveal.Api,
  setMoveableTargets: (target: HTMLElement[]) => void,
  addHistoryAction: (action: HistoryAction) => void
) {
  const slide = deck.getCurrentSlide()

  const videoContainer = document.createElement('div')
  videoContainer.classList.add('container', 'media-container')

  const iframeWrapper = document.createElement('div')
  iframeWrapper.classList.add('iframe-wrapper')

  const iframeElement = document.createElement('iframe')
  iframeElement.src = `https://www.youtube.com/embed/${youtubeUrlParser(url)}`

  iframeWrapper.append(iframeElement)
  videoContainer.append(iframeWrapper)
  slide.appendChild(videoContainer)

  setMoveableTargets([videoContainer])

  addHistoryAction({
    type: HistoryActionType.AddElement,
    element: videoContainer,
    deckState: deck.getState(),
  })
}
