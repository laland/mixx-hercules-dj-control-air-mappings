function HerculesAir () {}

HerculesAir.midi = {
  DeckA: {
    DeckAHotcue1: 0x05,
    DeckAHotcue2: 0x06,
    DeckAHotcue3: 0x07,
    DeckAHotcue4: 0x08
  },
  DeckB: {
    DeckBHotcue1: 0x1b,
    DeckBHotcue2: 0x1c,
    DeckBHotcue3: 0x1d,
    DeckBHotcue4: 0x1e
  },
  LEDS: {
    AllLeds: 0x7f
  }
}

// BASICS
HerculesAir.midiStatusNoteOn = 0x90;
HerculesAir.midiStatusModeChange = 0xB0;
HerculesAir.falsie = 0x00;
HerculesAir.truethy = 0x7f;
HerculesAir.turnOn = HerculesAir.truethy;
HerculesAir.turnOff = HerculesAir.falsie;

HerculesAir.buttonReleased = HerculesAir.turnOff;
HerculesAir.buttonPressed = HerculesAir.turnOn;
HerculesAir.jogForward = 0x01
HerculesAir.jogBackward = HerculesAir.truethy

// LEDS
HerculesAir.headMixButtonLed = 57
HerculesAir.headCueButtonLed = 58
HerculesAir.headMinusButtonLed = 59
HerculesAir.headPlusButtonLed = 60

HerculesAir.isShiftButtonPressed = false
HerculesAir.wheel_multiplier = 0.9
HerculesAir.testLEDnum = 0

HerculesAir.init = function(id) {
  HerculesAir.resetLEDs()

  HerculesAir.sendMidiMsg(HerculesAir.headMinusButtonLed, HerculesAir.turnOn) // headset volume "-" button LED (always on)
  HerculesAir.sendMidiMsg(HerculesAir.headPlusButtonLed, HerculesAir.turnOn) // headset volume "+" button LED (always on)

  if(engine.getValue("[Master]", "headMix") > 0.5) {
    HerculesAir.sendMidiMsg(HerculesAir.headMixButtonLed, HerculesAir.turnOn)
  } else {
    HerculesAir.sendMidiMsg(HerculesAir.headCueButtonLed, HerculesAir.turnOn)
  }
  //
  // engine.connectControl("[Channel1]", "beat_active", "HerculesAir.beatProgressDeckA")
  // engine.connectControl("[Channel1]", "play", "HerculesAir.playDeckA")
  //
  // engine.connectControl("[Channel2]", "beat_active", "HerculesAir.beatProgressDeckB")
  // engine.connectControl("[Channel2]", "play", "HerculesAir.playDeckB")
}

HerculesAir.shutdown = function() {
  HerculesAir.resetLEDs()
}

HerculesAir.headCue = function(midino, control, value, status, group) {
  if(engine.getValue(group, "headMix") == 1) {
    engine.setValue(group, "headMix", -1.0);
    HerculesAir.sendMidiMsg(HerculesAir.headMixButtonLed, HerculesAir.turnOff);
    HerculesAir.sendMidiMsg(HerculesAir.headCueButtonLed, HerculesAir.turnOn);
  }
};

HerculesAir.headMix = function(midino, control, value, status, group) {
  if(engine.getValue(group, "headMix") != 1) {
    engine.setValue(group, "headMix", 1.0);
    HerculesAir.sendMidiMsg(HerculesAir.headMixButtonLed, HerculesAir.turnOn);
    HerculesAir.sendMidiMsg(HerculesAir.headCueButtonLed, HerculesAir.turnOff);
  }
};

HerculesAir.resetLEDs = function() {
  HerculesAir.sendMidiMsg(HerculesAir.midi.LEDS.AllLeds, HerculesAir.turnOff, HerculesAir.midiStatusModeChange)
}

HerculesAir.hotcue = function(midino, control, value, status, group) {
  if (value === HerculesAir.buttonReleased) {
    return;
  }

  var hotcueMap = {
    0x05: 1,
    0x1b: 1,
    0x06: 2,
    0x1c: 2,
    0x07: 3,
    0x1d: 3,
    0x08: 4,
    0x1e: 4
  }
  var hotcueNum = hotcueMap[control];

  var affectedHotcue = 'hotcue_' + hotcueNum
  var hotcueActivate = affectedHotcue + '_activate';
  var hotcueClear = affectedHotcue + '_clear';

  if(HerculesAir.isShiftButtonPressed) {
    engine.setValue(group, hotcueClear, 1)
  } else {
    engine.setValue(group, hotcueActivate, 1);
  }
}

HerculesAir.jog = function(midino, control, value, status, group) {
  engine.setValue(
    group,
    'jog',
    HerculesAir.getWhellMovementDirection(value) * HerculesAir.wheel_multiplier
  )
}

HerculesAir.wheelTurn = function(midino, control, value, status, group) {
  var deckNum = script.deckFromGroup(group);
  var movementDirection = HerculesAir.getWhellMovementDirection(value);

  if (!engine.isScratching(deckNum)) {
    engine.setValue(group, "jog", movementDirection * HerculesAir.wheel_multiplier);
    return;
  }

  if (HerculesAir.isShiftButtonPressed && HerculesAir.isDeckStopped(group)) {
    var newPosition = engine.getValue(group, "playposition") + 0.008 * movementDirection
    if(newPosition < 0) newPosition = 0;
    if(newPosition > 1) newPosition = 1;
    engine.setValue(group,"playposition",newPosition);
    return;
  }

  engine.scratchTick(deckNum, movementDirection)
}

HerculesAir.scratch_enable = function(midino, control, value, status, group) {
  var deck = script.deckFromGroup(group);
  var scratchEnable_alpha = 1.0 / 8
  var scratchEnable_beta = scratchEnable_alpha / 32
  var scratchEnable_intervalsPerRev = 128
  var scratchEnable_rpm = 33 + 1/3

  if(value == HerculesAir.turnOn) {
    engine.scratchEnable(
      deck,
      scratchEnable_intervalsPerRev,
      scratchEnable_rpm,
      scratchEnable_alpha,
      scratchEnable_beta
    )
    return;
  }

  engine.scratchDisable(deck)
}

HerculesAir.shift = function(midino, control, value, status, group) {
  HerculesAir.isShiftButtonPressed = (value == HerculesAir.turnOn)
  HerculesAir.sendMidiMsg(control, value);
}

HerculesAir.isDeckStopped = function(group) {
  return engine.getValue(group, "play") == 0
}

HerculesAir.getWhellMovementDirection = function(value) {
  return value == 0x01 ? 1 : -1
}

HerculesAir.sendMidiMsg = function(control, value, status) {
  var statusTosend = status === void 1 ? HerculesAir.midiStatusNoteOn : status;
  midi.sendShortMsg(statusTosend, control, value)
}
