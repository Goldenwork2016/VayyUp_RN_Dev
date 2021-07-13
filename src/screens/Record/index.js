import React, {useState} from 'react';
import VideoRecorder from './VideoRecorder';
import EnterDetails from './EnterDetails';
import Introduction from './Introduction';

const Status = {
  Introduction: 'Introduction',
  Recording: 'Recording',
  EnterDetails: 'EnterDetails',
};

const Record = ({route}) => {
  const {params = {}} = route;
  const {competition = {}} = params;
  const [status, setStatus] = useState(Status.Introduction);
  const [karaokeVideo, setKaraokeVideo] = useState({});
  const [uploadVideo, setUploadVideo] = useState(false);
  const [type, setType] = useState('karaoke');
  const [karaokeType, setKaraokeType] = useState(false);
  const [video, setVideo] = useState();
  const [lagTime, setLagTime] = useState(0);

  const changeStatus = (newStatus) => {
    setStatus(newStatus);
  };

  const handleStartRecording = (karaoke, _type,karaokeType) => {
    
    setKaraokeVideo(karaoke);
    setType(_type);
    setStatus(Status.Recording);
    setKaraokeType(karaokeType);
  };

  const handleFinishRecording = (recordedVideo, time) => {
    setVideo(recordedVideo);
    setLagTime(time);
    setStatus(Status.EnterDetails);
  };

  const handleUploadVideo = (selectedVideo) => {
    setVideo(selectedVideo);
    setUploadVideo(true);
    setStatus(Status.EnterDetails);
  };

  const handleCancel = () => {
    setStatus(Status.Introduction);
  };

  return (
    <>
      {status === Status.Introduction && (
        <Introduction
          competition={competition}
          onStartRecording={handleStartRecording}
          onUploadVideo={handleUploadVideo}
        />
      )}
      {status === Status.Recording && (
        <VideoRecorder
          karaokeVideo={karaokeVideo}
          type={type}
          karaokeType={karaokeType}
          onCloseCamera={changeStatus.bind(this, Status.Introduction)}
          onFinishRecording={handleFinishRecording}
        />
      )}

      {status === Status.EnterDetails && (
        <EnterDetails
          karaokeVideo={karaokeVideo}
          type={type}
          video={video}
          karaokeType={karaokeType}
          lagTime={lagTime}
          competition={competition}
          uploadVideo={uploadVideo}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default Record;
