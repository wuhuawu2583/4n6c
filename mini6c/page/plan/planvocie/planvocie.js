// page/plan/planvocie/planvocie.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
        showVoiceMask: true,
        startRecording: false,
        cancleRecording:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

 // 开始录音

   startRecording:function (e) {

      console.log('开始录音');
  
      this.setData({
  
        selectType: 'voice',
        startRecording:true
      })
  
      this.startVoiceRecordAnimation();
  
      var that = this;
  
      const recorderManager = wx.getRecorderManager();
  
      recorderManager.start({
  
        format: 'mp3',
  
      });
  
      recorderManager.onStart(() => {
  
        console.log('recorder start')
  
      })
  
    },
  
    // 结束录音
  
    stopRecording: function (e) {
  
      console.log('结束录音');
  
      var that = this;
  
      const recorderManager = wx.getRecorderManager();
  
      recorderManager.stop();
  
      recorderManager.onStop((res) => {
  
        console.log('recorder stop', res)
  
        const { tempFilePath } = res;
  
        if (res.duration < 1000) {
  
          wx.showToast({
  
            title: '说话时间太短!',
            icon:'none'
          })
  
          this.stopVoiceRecordAnimation();
  
          that.setData({
            startRecording: false
          })
  
          return;
  
        }
  
        if (this.data.cancleRecording === false) {
  
          if (tempFilePath.length !== 0) {
  
            var recordLength = 0;
  
            if (res.duration / 1000 < 22) {
  
              recordLength = 160;
  
            } else {
  
              recordLength = (res.duration / 1000) / 60 * 440;
  
            }
  
            var recordTime = (res.duration / 1000).toFixed(0);
  
            console.log('recordLength' + recordLength);
  
            that.setData({
  
              recordingLength: recordLength,
  
              recordingTime: recordTime,
  
              voiceTempFilePath: tempFilePath,
  
              selectResource: true,
  
              showVoiceMask: false,
  
              startRecording: false
  
            })
            console.log('recorderManager.onStop被调用showVoiceMask========='+showVoiceMask+'startRecording============='+startRecording);
            that.stopVoiceRecordAnimation();
  
          }
  
        } else {
  
          that.setData({
  
            selectResource: false,
  
            showVoiceMask: false,
  
            startRecording: false,
  
            cancleRecording:false
  
          })
  
          that.stopVoiceRecordAnimation();
  
        }
  
      })
  
    },
  
    //向上滑动取消录音
  
    moveToCancle: function (event) {
  
      let currentY = event.touches[0].pageY;
  
      if (this.data.lastVoiceYPostion !== 0) {
  
        if (currentY - this.data.lastVoiceYPostion < 0 && currentY < 470) {
  
          this.setData({
  
            cancleRecording:true
  
          })
  
        }
        console.log('moveToCancle被调用======'+cancleRecording);
      }
  
      this.setData({
  
        lastVoiceYPostion: currentY
  
      })
  
    },
  
    //麦克风帧动画 
  
    startVoiceRecordAnimation:function () {
  
      var that = this;
  
      //话筒帧动画 
  
      var i = 1;
  
      that.data.recordAnimationSetInter = setInterval(function () {
  
        i++;
  
        i = i % 5;
  
        that.setData({
  
          recordAnimationNum: i
  
        })
         console.log('recordAnimationSetInter被调用======'+that.data.recordAnimationNum);
      }, 300);
  
    },
  
    // 停止麦克风动画计时器
  
    stopVoiceRecordAnimation:function () {
  
      var that = this;
  
      clearInterval(that.data.recordAnimationSetInter);
  
    },

})