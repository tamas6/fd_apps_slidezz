import { useAtomValue } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { BsDownload } from 'react-icons/bs'

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
} from '@chakra-ui/react'

import {
  ExportType,
  currentSlideToImage,
  slidesToPdf,
} from '../../../actions/exportSlides'
import {
  loadingModalSetActionAtom,
  moveableTargetsAtom,
  slidesDeckAtom,
  slideshowSettingsAtom,
} from '../../../store'
import SidebarItem from './SidebarItem'

export default function DownloadSlides() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const deck = useAtomValue(slidesDeckAtom)
  const setMoveableTargets = useUpdateAtom(moveableTargetsAtom)
  const loadingModalSetAction = useUpdateAtom(loadingModalSetActionAtom)
  const slideshowSettings = useAtomValue(slideshowSettingsAtom)

  return (
    <>
      <SidebarItem
        icon={BsDownload}
        label="Download"
        onClick={() => {
          setMoveableTargets([])
          onOpen()
        }}
      />

      <Modal size={{ base: 'xs', md: 'sm' }} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Download slides</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack w={{ base: 'full', md: '80%' }} mx="auto" gap={2}>
              <Button
                w="full"
                onClick={() => {
                  if (!deck) return
                  currentSlideToImage(
                    deck,
                    ExportType.JPEG,
                    loadingModalSetAction,
                    slideshowSettings
                  )
                  onClose()
                }}
                size="md"
                variant="c-outline"
              >
                JPEG image(.jpg, current slide)
              </Button>
              <Button
                w="full"
                onClick={() => {
                  if (!deck) return

                  currentSlideToImage(
                    deck,
                    ExportType.PNG,
                    loadingModalSetAction,
                    slideshowSettings
                  )
                  onClose()
                }}
                size="md"
                variant="c-outline"
              >
                PNG image(.png, current slide)
              </Button>
              <Button
                w="full"
                onClick={() => {
                  if (!deck) return

                  currentSlideToImage(
                    deck,
                    ExportType.SVG,
                    loadingModalSetAction,
                    slideshowSettings
                  )
                  onClose()
                }}
                size="md"
                variant="c-outline"
              >
                SVG image(.svg, current slide)
              </Button>
              <Button
                w="full"
                size="md"
                variant="c-outline"
                onClick={() => {
                  if (!deck) return
                  slidesToPdf(deck, loadingModalSetAction, slideshowSettings)
                  onClose()
                }}
              >
                PDF document(.pdf)
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
