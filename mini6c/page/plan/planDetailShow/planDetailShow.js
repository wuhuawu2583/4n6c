const config = require('../../../config')
var util = require("../../../util/dateutil.js");
var tempFilePath
const myaudio = wx.createInnerAudioContext()
const app = getApp()

Page({

  onLoad: function (options) {
    console.info("打开：" + options.id);

    this.setData({
      planId: options.id,
      planCycle: options.planCycle,
      showVoiceMask: false,
      startRecording: false,
      cancleRecording:false,
      recordAnimationNum:0,
      lastVoiceYPostion:0,
      audKey:'',  //当前选中的音频key
    })

    //获取最新消息数据
    this.getNewPlanData()

  },

  getNewPlanData: function () {
    
    const self = this
    var sessionId = app.globalData.sessionId

    var detailUrl
    if(self.data.planCycle==0){
      detailUrl='/planCr/detailWeek'
    }else if(self.data.planCycle==1){
      detailUrl='/planCr/detailMonth'
    }else{
      detailUrl='/planCr/detailYear'
    }

    if (sessionId) {
      wx.request({
        url: config.domain + detailUrl,
        data: {
          id: this.data.planId
        },
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Cookie': 'JSESSIONID=' + sessionId
        },
        success(result) {

          console.log(result.data.success)
          var planProgressList=result.data.planProgressList
          var plan=result.data.plan
          let kpis = plan.kpiDetails;
          if(kpis!=null){
            for (let i = 0; i < kpis.length; i++ ){	
              kpis[i].score=util.formatDouble(kpis[i].score)
              kpis[i].baseValue=util.formatDouble(kpis[i].baseValue)
              kpis[i].reasonableValue=util.formatDouble(kpis[i].reasonableValue)
              kpis[i].weight=util.formatDouble(kpis[i].weight)
              kpis[i].actualValue=util.formatDouble(kpis[i].actualValue)
            }
          }

          self.setData({
            plan: plan,
            planProgressList:planProgressList
          })

          var title = plan.title

          wx.setNavigationBarTitle({
            title: title,
            success() {              
            },
            fail(err) {              
            }
          })
        },

        fail({ errMsg }) {
          console.log('【plan/detailMonth fail】', errMsg)
        }
      })
    }
  },

  addAction: function (e) {
    var id = e.currentTarget.dataset.id
    console.log('【planAddAction/planAddAction】id=', id)
    wx.navigateTo({ url: '../planAddAction/planAddAction?id=' + id })
  },

  showVoiceDialog:function(e){
    
    if(this.data.showVoiceMask){
      this.setData({
         showVoiceMask:false
      })
    }else{
      this.setData({
         showVoiceMask:true
      })
    }
    
  },

  //语音上传   开始
  //按住录音按钮，开始录音方法
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
        duration: 60000, //指定录音的时长，单位 ms，最大为10分钟（600000），默认为1分钟（60000）
        sampleRate: 16000, //采样率
        numberOfChannels: 1, //录音通道数
        encodeBitRate: 96000, //编码码率
        format: 'mp3', //音频格式，有效值 aac/mp3
        frameSize: 50, //指定帧大小，单位 KB
    });

    recorderManager.onStart(() => {
      console.log('recorder start')
    })
  },

  //手指松开录音按钮，停止录音
  stopRecording: function (e) {

    var that = this;
    const recorderManager = wx.getRecorderManager();
    recorderManager.stop();
    console.log('结束录音');
    recorderManager.onStop((res) => {
     
      console.log('recorder stop', res)
      //const { tempFilePath } = res;
      tempFilePath=res.tempFilePath

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

      console.log('cancleRecording==='+this.data.cancleRecording)
      if (this.data.cancleRecording === false) {
        //判断tempFilePath是否真实有效
        if (tempFilePath.length !== 0) {
          var recordLength = 0;
          if (res.duration / 1000 < 22) {
            recordLength = 160;
          } else {
            recordLength = (res.duration / 1000) / 60 * 440;
          }
          var recordTime = (res.duration / 1000).toFixed(0);
          console.log('recordLength======' + recordLength);

          that.setData({
            recordingLength: recordLength,
            recordingTime: recordTime,
            voiceTempFilePath: tempFilePath,
            selectResource: true,
            showVoiceMask: false,
            startRecording: false
          })
          that.stopVoiceRecordAnimation();

          //手指挪开，暂停录音后，向后台传送录音文件 开始
          console.log('tempFilePath=====',tempFilePath)
          var sessionId = app.globalData.sessionId
          console.log('sessionId==='+sessionId)
          wx.uploadFile({
              url: config.domain + '/fileController/weiXingUploadImFile',
              filePath: tempFilePath,
              name:"file",//后台要绑定的名称
              header: {
                "content-Type": "multipart/form-data",
                'Cookie': 'JSESSIONID=' + sessionId
              },
              //参数绑定,可以向后台传递多个参数
              formData:{
                upFileType:16,
                //recordingtime: recordTime,//发送语音的时间
                //facId: 11211,//业务id
                //userId:1,//用户id
              },
              success:function(result){

                var resultData = JSON.parse(result.data.replace(/\n/g,"\\n").replace(/\r/g,"\\r"))
                console.log('result.data.uuid====='+resultData.uuid);
                //语音文件上传成功后
                if(resultData.success){

                  wx.request({
                    url: config.domain + '/planCr/addVoiceProcess',
                    data : {
                      planId: that.data.planId,
                      detailId:'',
                      uuid:resultData.uuid,
                      timeLength:that.data.recordingLength,
                      idType: 0,
                      isSendAdviser:false
                    },
                    method: 'POST',
                    header: {
                      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                      'Cookie': 'JSESSIONID=' + sessionId
                    },
                    success(result) {
             
                        if(result.data.success){
                          //创建成功，获取最新消息数据
                          that.getNewPlanData()
                        }else{ 
                          //创建失败，提示错误信息
                        }
                    },
                    fail({ errMsg }) {
                      //创建失败提示错误信息代码开始
                    }
                  })
                }
      
              },
              fail: function(ress){
                console.log("。。录音保存失败。。");
              }
          })

        }
      } else {

        that.setData({
          selectResource: false,
          showVoiceMask: false,
          startRecording: false,
          cancleRecording:false
        })
        console.log('recorderManager.onStop被调用showVoiceMask========='+this.data.showVoiceMask+'   startRecording============='+this.data.startRecording);
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
      console.log('moveToCancle被调用======'+this.data.cancleRecording);
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
    }, 600);
  },

  // 停止麦克风动画计时器
  stopVoiceRecordAnimation:function () {
    var that = this;
    clearInterval(that.data.recordAnimationSetInter);
  },
  //语音上传   结束


  //音频播放   开始
 audioPlay: function (e) {

    var that = this
    var id = e.currentTarget.dataset.id
    var key = e.currentTarget.dataset.key
    var audioArr = that.data.planProgressList
    
    //设置状态
    audioArr.forEach((v, i, array) => {
      v.isRead = false;
      if (i == key) {
        v.isRead = true;
      }
    })

    that.setData({
      audioArr: audioArr,
      audKey: key,
    })
  
    myaudio.autoplay = true
    var audKey = that.data.audKey
    var vidSrc = config.domain + audioArr[audKey].content
    myaudio.src = vidSrc
    //audioArr[audKey].isRead = true

    myaudio.play();
    console.log('vidSrc======'+vidSrc)
    //开始监听
    myaudio.onPlay(() => {
      console.log('onPlay======开始播放')
    })
    
    //结束监听
    myaudio.onEnded(() => {

      console.log('onEnded======自动播放完毕');
      audioArr[key].isRead = false;
      that.setData({
        audioArr: audioArr,
      })
      return
    })

    //错误回调
    myaudio.onError((err) => {
      console.log(err); 
      audioArr[key].isRead = false;
      that.setData({
        audioArr: audioArr,
      })
      return
    })
  },
  
  // 音频停止
  // 音频停止
  audioStop(e){
    var that = this
    var key = e.currentTarget.dataset.key
    var audioArr = that.data.audioArr
    //设置状态
    audioArr.forEach((v, i, array) => {
      v.isRead = false;
    })
    that.setData({
      audioArr: audioArr
    })

    myaudio.stop();

    //停止监听
    myaudio.onStop(() => {
      console.log('停止播放');
    })

  },

})
