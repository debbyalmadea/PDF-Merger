import { faGripLines } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, SetStateAction } from "react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "./StrictModeDroppable";
interface DraggableListInterface {
  fileList: [] | File[];
  setFileList: Dispatch<SetStateAction<[] | File[]>>;
}

export default function DraggableList({
  fileList,
  setFileList,
}: DraggableListInterface) {
  /**
   * update list on drop
   *
   * @param droppedItem item that is being dropped
   */
  const handleDrop = (droppedItem: any) => {
    if (!droppedItem.destination) return;
    var updatedList = [...fileList];
    const [reorderedFile] = updatedList.splice(droppedItem.source.index, 1);
    updatedList.splice(droppedItem.destination.index, 0, reorderedFile);
    setFileList(updatedList);
  };
  return (
    <DragDropContext onDragEnd={handleDrop}>
      <StrictModeDroppable droppableId="list-container">
        {(provided) => (
          <div
            className="list-container"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {fileList.map((file, index) => (
              <Draggable key={file.name} draggableId={file.name} index={index}>
                {(provided, snapshot) => (
                  <div
                    className={`file-container flex flex-row items-center space-x-2 px-4 py-2 rounded-xl
                              ${
                                snapshot.isDragging
                                  ? "bg-[#E0E1E6]"
                                  : "bg-transparent"
                              }`}
                    ref={provided.innerRef}
                    {...provided.dragHandleProps}
                    {...provided.draggableProps}
                  >
                    <p className="text-[#A2A5B5]">
                      <FontAwesomeIcon icon={faGripLines} />
                    </p>
                    <p>{file.name}</p>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
}
