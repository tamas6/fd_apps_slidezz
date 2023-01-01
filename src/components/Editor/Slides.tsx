import { Editor } from '@tiptap/react'
import fscreen from 'fscreen'
import { useAtom } from 'jotai'
import MoveableHelper from 'moveable-helper'
import React, { RefObject, useEffect, useRef, useState } from 'react'
import Moveable from 'react-moveable'
import Selecto from 'react-selecto'
import Reveal from 'reveal.js'
import RevealHighlight from 'reveal.js/plugin/highlight/highlight'
import Markdown from 'reveal.js/plugin/markdown/markdown'

import { Box, Image, Textarea } from '@chakra-ui/react'

import { wrapSlideElements } from '../../actions/wrapSlideElements'
import { LogoPositions } from '../../config/logo-positions'
import useColors from '../../hooks/useColors'
import useTextEditor from '../../hooks/useTextEditor'
import {
  HistoryActionType,
  addHistoryActionAtom,
  editModeAtom,
  moveableHelperAtom,
  moveableTargetsAtom,
  replaceImageElementAtom,
  slidesDeckAtom,
  slidesLogoAtom,
  slideshowSettingsAtom,
  styleSettingsAtom,
} from '../../store'
import { EditMode, Slides as SlidesType } from '../../types'
import { isHTML } from '../../utils'
import {
  MoveableDeleteButton,
  MoveableDeleteButtonProps,
} from './Moveable/Ables/MoveableDeleteButton'
import {
  MoveableDimension,
  MoveableDimensionProps,
} from './Moveable/Ables/MoveableDimension'
import {
  MoveableReplaceImage,
  MoveableReplaceImageProps,
} from './Moveable/Ables/MoveableReplaceImage'
import { ReplaceImage } from './ReplaceImage'

interface SlidesProps {
  deckName: string
  slides: SlidesType
  editor: Editor | null
}

export default function Slides({ deckName, slides, editor }: SlidesProps) {
  const [, setEditMode] = useAtom(editModeAtom)
  const [deck, setDeck] = useAtom(slidesDeckAtom)
  const { overlay0 } = useColors()
  const moveableRef = useRef() as RefObject<
    Moveable<
      MoveableDeleteButtonProps &
        MoveableDimensionProps &
        MoveableReplaceImageProps
    >
  >

  const selectoRef = useRef() as RefObject<Selecto>

  const [replaceImageElement, setReplaceImageElement] = useAtom(
    replaceImageElementAtom
  )
  const [slideshowSettings] = useAtom(slideshowSettingsAtom)
  const [styleSettings] = useAtom(styleSettingsAtom)
  const [slidesLogo] = useAtom(slidesLogoAtom)
  const [moveableTargets, setMoveableTargets] = useAtom(moveableTargetsAtom)
  const [moveableHelper] = useAtom(moveableHelperAtom)
  const [elementGuidelines, setElementGuidelines] = useState<HTMLElement[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [, addHistoryAction] = useAtom(addHistoryActionAtom)
  const slidesRef = useRef() as RefObject<HTMLDivElement>
  useTextEditor()

  useEffect(() => {
    if (slidesRef.current && isHTML(slides.data))
      slidesRef.current.innerHTML = slides.data
  }, [slidesRef, slides.data])

  useEffect(() => {
    document.body.setAttribute('data-theme', styleSettings.theme)
  }, [styleSettings])

  useEffect(() => {
    const newDeck = new Reveal(
      document.querySelector(`.${deckName}`) as HTMLElement,
      {
        embedded: true,
        keyboardCondition: 'focused',
        plugins: [Markdown, RevealHighlight],
        ...slideshowSettings,
        center: false,
        history: false,
        width: slides.width || 1920,
        height: slides.height || 1080,
        minScale: 0,
      }
    )
    newDeck.initialize().then(() => {
      newDeck.layout()
      newDeck.sync()

      newDeck.getSlides().forEach((slide) => {
        wrapSlideElements(Array.from(slide.children) as HTMLElement[])
      })

      const containers = Array.from(
        newDeck.getRevealElement().querySelectorAll('.container')
      ) as HTMLElement[]

      containers.forEach((container) => {
        const transform = container.style.transform
        const translateReg = /translate\((.*?)\)/.exec(transform)
        const rotateReg = /rotate\((.*?)\)/.exec(transform)

        const properties = {
          transform: {
            translate: translateReg ? translateReg[1].trim() : '0px, 0px',
            rotate: rotateReg ? rotateReg[1].trim() : '0deg',
          },
        }

        moveableHelper.createFrame(container, properties)
      })

      setElementGuidelines([
        newDeck.getRevealElement() as HTMLElement,
        newDeck.getSlidesElement() as HTMLElement,
        newDeck.getViewportElement() as HTMLElement,
      ])

      newDeck.on('slidechanged', () => {
        setMoveableTargets([])
      })

      newDeck.on('overviewshown', () => {
        setMoveableTargets([])
      })

      setDeck(newDeck)
    })

    const handleFullScreenChange = () => {
      setIsFullscreen(fscreen.fullscreenElement !== null)
    }

    fscreen.addEventListener('fullscreenchange', handleFullScreenChange)

    return () => {
      newDeck.destroy()
      fscreen.removeEventListener('fullscreenchange', handleFullScreenChange)
    }
  }, [])

  useEffect(() => {
    if (deck) deck.configure(slideshowSettings)
  }, [slideshowSettings, deck])

  useEffect(() => {
    if (editor && deck) {
      const editorElement = editor.options.element
      const revealElement = deck.getRevealElement() as HTMLElement
      if (revealElement.contains(editorElement)) {
        const editorHTML = editor.getHTML()
        const parentElement = editorElement.parentElement

        if (parentElement) {
          parentElement.removeChild(editorElement)
          parentElement.innerHTML = editorHTML
        }
      }
      setEditMode(EditMode.MOVE)
    }
  }, [moveableTargets, editor, deck, setEditMode])

  useEffect(() => {
    if (deck) {
      const staticToAbsolute = () => {
        const staticElements: {
          element: HTMLElement
          offsetTop: number
          offsetLeft: number
          offsetWidth: number
          offsetHeight: number
        }[] = []
        const elements = Array.from(
          (deck.getRevealElement() as HTMLElement).querySelectorAll(
            '.present .container'
          )
        ) as HTMLElement[]

        for (const element of elements) {
          if (window.getComputedStyle(element).position === 'static') {
            staticElements.push({
              element,
              offsetTop: element.offsetTop,
              offsetLeft: element.offsetLeft,
              offsetHeight: element.offsetHeight,
              offsetWidth: element.offsetWidth,
            })
          }
        }

        for (const {
          element,
          offsetTop,
          offsetLeft,
          offsetWidth,
          offsetHeight,
        } of staticElements) {
          element.style.position = 'absolute'
          element.style.top = `${offsetTop}px`
          element.style.left = `${offsetLeft}px`
          element.style.width = `${offsetWidth}px`
          element.style.height = `${offsetHeight}px`
        }
      }

      staticToAbsolute()

      deck.on('slidechanged', staticToAbsolute)

      return () => deck.off('slidechanged', staticToAbsolute)
    }
  }, [deck])

  return (
    <Box
      className="slideshow"
      position="relative"
      borderWidth="2px"
      borderColor={moveableTargets.length ? overlay0 : 'blue.500'}
      borderBottom="none"
      w="full"
      h="full"
    >
      {replaceImageElement && !isFullscreen && <ReplaceImage />}

      <Box overflow="visible" className={`reveal ${deckName}`}>
        {!isFullscreen && deck ? (
          <Selecto
            ref={selectoRef}
            // The container to add a selection element
            container={deck.getRevealElement() as HTMLElement}
            // Targets to select. You can register a queryselector or an Element.
            selectableTargets={['section.present *']}
            // Whether to select by click (default: true)
            selectByClick={true}
            // Whether to select from the target inside (default: true)
            selectFromInside={true}
            // After the select, whether to select the next target with the selected target (deselected if the target is selected again).
            continueSelect={false}
            // Determines which key to continue selecting the next target via keydown and keyup.
            toggleContinueSelect={'shift'}
            // The container for keydown and keyup events
            keyContainer={deck?.getRevealElement() as HTMLElement}
            // The rate at which the target overlaps the drag area to be selected. (default: 100)
            hitRate={100}
            onDragStart={(e) => {
              const moveable = moveableRef.current
              const target = e.inputEvent.target

              if (
                moveable?.isMoveableElement(target) ||
                moveableTargets.some((t) => t === target || t.contains(target))
              ) {
                e.stop()
              }
            }}
            onSelectEnd={(e) => {
              const selected: HTMLElement[] = []
              const moveable = moveableRef.current
              const containers = Array.from(
                document.querySelectorAll('.present .container')
              ) as HTMLElement[]

              for (const element of e.selected) {
                for (const container of containers) {
                  if (
                    container.contains(element) &&
                    !selected.includes(container)
                  )
                    selected.push(container)
                }
              }

              setMoveableTargets((prevs) => {
                if (
                  prevs.length !== selected.length ||
                  !prevs.every((prev, i) => selected[i] === prev)
                ) {
                  addHistoryAction({
                    type: HistoryActionType.SetMoveableTargets,
                    prevs,
                    nexts: selected,
                  })
                }
                return selected
              })

              if (e.isDragStart) {
                e.inputEvent.preventDefault()

                setTimeout(() => {
                  moveable?.dragStart(e.inputEvent)
                })
              }
            }}
          />
        ) : null}

        <Box ref={slidesRef} className="slides">
          {!isHTML(slides.data) && (
            <section data-markdown="" data-separator="---">
              <Textarea data-template defaultValue={slides.data} />
            </section>
          )}

          {!isFullscreen ? (
            <Moveable<
              MoveableDeleteButtonProps &
                MoveableDimensionProps &
                MoveableReplaceImageProps
            >
              ables={[
                MoveableDeleteButton,
                MoveableDimension,
                MoveableReplaceImage,
              ]}
              replaceImage={true}
              deleteButton={true}
              dimension={true}
              ref={moveableRef}
              bounds={{
                left: 0,
                top: 0,
                right: document.querySelector('.slides')?.clientWidth,
                bottom: document.querySelector('.slides')?.clientHeight,
              }}
              elementGuidelines={elementGuidelines}
              target={moveableTargets}
              setTarget={setMoveableTargets}
              setReplaceImageElement={setReplaceImageElement}
              draggable={true}
              throttleDrag={0}
              startDragRotate={0}
              throttleDragRotate={0}
              zoom={1}
              origin={true}
              padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
              resizable={true}
              keepRatio={false}
              throttleScale={0}
              renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
              edge={false}
              snappable={true}
              rotatable={true}
              verticalGuidelines={[0, 200, 400]}
              horizontalGuidelines={[0, 200, 400]}
              snapThreshold={5}
              isDisplaySnapDigit={true}
              snapGap={true}
              snapDirections={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                center: true,
                middle: true,
              }}
              elementSnapDirections={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                center: true,
                middle: true,
              }}
              snapDigit={0}
              onResizeStart={moveableHelper.onResizeStart}
              onResize={moveableHelper.onResize}
              onDragStart={(e) => {
                moveableHelper.onDragStart(e)
              }}
              onDrag={moveableHelper.onDrag}
              onDragEnd={(e) => {
                // if (e.lastEvent)
                // addHistoryAction({
                //   type: HistoryActionType.SetTransform,
                //   element: e.target as HTMLElement,
                //   prev: frame.transform,
                //   next: e.lastEvent.transform,
                // })
              }}
              onRotateStart={moveableHelper.onRotateStart}
              onRotate={moveableHelper.onRotate}
              onDragGroupStart={moveableHelper.onDragGroupStart}
              onDragGroup={moveableHelper.onDragGroup}
              onRotateGroupStart={moveableHelper.onRotateGroupStart}
              onRotateGroup={moveableHelper.onRotateGroup}
              onResizeGroupStart={moveableHelper.onResizeGroupStart}
              onResizeGroup={moveableHelper.onResizeGroup}
              onClickGroup={(e) => {
                selectoRef.current?.clickTarget(e.inputEvent, e.inputTarget)
              }}
              onClick={(e) => {
                if (e.isDouble && moveableTargets.length === 1 && editor) {
                  setEditMode(EditMode.TEXT)
                  const target = e.target as HTMLElement
                  editor.commands.setContent(target.innerHTML)
                  target.innerHTML = ''
                  target.append(editor.options.element)
                  editor.commands.focus()
                }
              }}
            />
          ) : null}
        </Box>
        {slidesLogo && (
          <Image
            alt="logo"
            zIndex={100}
            position="absolute"
            {...LogoPositions[slideshowSettings.slidesLogoPosition]}
            h={{ base: '10px', sm: '20px', md: '30px', lg: '50px' }}
            w={{ base: '10px', sm: '20px', md: '30px', lg: '50px' }}
            objectFit="cover"
            src={slidesLogo.data}
          />
        )}
      </Box>
    </Box>
  )
}
