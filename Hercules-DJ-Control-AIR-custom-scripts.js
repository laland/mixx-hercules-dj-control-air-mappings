/**
 * Lnks:
 * - https://github.com/mixxxdj/mixxx/wiki
 * - https://github.com/mixxxdj/mixxx/wiki/Components%20JS
 * - https://github.com/mixxxdj/mixxx/wiki/midi%20scripting
 * - https://www.youtube.com/watch?v=QUT8tZmwM00
 * - https://bugs.launchpad.net/mixxx/+bug/706046
 */

function HerculesAir () {}

// BASICS
HerculesAir.midiMaster = 0x90;
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

// MISC
HerculesAir.beatStepDeckA1 = 0
HerculesAir.beatStepDeckA2 = 68
HerculesAir.beatStepDeckB1 = 0
HerculesAir.beatStepDeckB2 = 76

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

	engine.connectControl("[Channel1]", "beat_active", "HerculesAir.beatProgressDeckA")
	engine.connectControl("[Channel1]", "play", "HerculesAir.playDeckA")

	engine.connectControl("[Channel2]", "beat_active", "HerculesAir.beatProgressDeckB")
	engine.connectControl("[Channel2]", "play", "HerculesAir.playDeckB")
}

HerculesAir.shutdown = function() {
	HerculesAir.resetLEDs()
}

HerculesAir.playDeckA = function() {
	if(engine.getValue("[Channel1]", "play") == 0) {
		HerculesAir.sendMidiMsg(HerculesAir.beatStepDeckA1, HerculesAir.turnOff)
		HerculesAir.beatStepDeckA1 = 0
		HerculesAir.beatStepDeckA2 = 68
	}
}

HerculesAir.playDeckB = function() {
	if(engine.getValue("[Channel2]", "play") == 0) {
		HerculesAir.sendMidiMsg(HerculesAir.beatStepDeckB1, HerculesAir.turnOff)
		HerculesAir.beatStepDeckB1 = 0
		HerculesAir.beatStepDeckB2 = 76
	}
}

HerculesAir.beatProgressDeckA = function() {
	if(engine.getValue("[Channel1]", "beat_active") == 1) {
		if(HerculesAir.beatStepDeckA1 != 0) {
			HerculesAir.sendMidiMsg(HerculesAir.beatStepDeckA1, HerculesAir.turnOff)
		}

		HerculesAir.beatStepDeckA1 = HerculesAir.beatStepDeckA2

		HerculesAir.sendMidiMsg(HerculesAir.beatStepDeckA2, HerculesAir.turnOn)
		if(HerculesAir.beatStepDeckA2 < 71) {
			HerculesAir.beatStepDeckA2++
		} else {
			HerculesAir.beatStepDeckA2 = 68
		}
	}
}

HerculesAir.beatProgressDeckB = function() {
	if(engine.getValue("[Channel2]", "beat_active") == 1) {
		if(HerculesAir.beatStepDeckB1 != 0) {
			HerculesAir.sendMidiMsg(HerculesAir.beatStepDeckB1, HerculesAir.turnOff)
		}

		HerculesAir.beatStepDeckB1 = HerculesAir.beatStepDeckB2

		HerculesAir.sendMidiMsg(HerculesAir.beatStepDeckB2, HerculesAir.turnOn)
		if(HerculesAir.beatStepDeckB2 < 79) {
			HerculesAir.beatStepDeckB2++
		} else {
			HerculesAir.beatStepDeckB2 = 76
		}
	}
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

HerculesAir.jog = function(midino, control, value, status, group) {
    engine.setValue(
    	group,
    	'jog',
			HerculesAir.getWhellMovementDirection(value) * HerculesAir.wheel_multiplier
	)
}

HerculesAir.testLED = function() {
	HerculesAir.sendMidiMsg(i, HerculesAir.turnOn)
}


HerculesAir.resetLEDs = function() {
	for(var i=1; i<79; i++) {
		HerculesAir.sendMidiMsg(i, HerculesAir.turnOff)
	}
}

HerculesAir.hotcue = function(group, hotcueNum, position) {
	print(['hotcue',group, hotcueNum, position].join(' '));
	var affectedHotcue = 'hotcue_' + hotcueNum

	var hotcueActivate = affectedHotcue + '_activate';
	var hotcuePosition = affectedHotcue + '_activate';
	var hotcueClear = affectedHotcue + '_clear';

	if(HerculesAir.isShiftButtonPressed) {
		engine.setValue(group, hotcueClear, 1)
	} else {
		engine.setValue(group, hotcueActivate, 1)
		engine.setValue(group, hotcuePosition, position)
	}
}

HerculesAir.hotcue1 = function(midino, control, value, status, group) {
	print(['hotcue1',midino, control, value, status, group].join(' '));
	HerculesAir.hotcue(group, 1, value)
}

HerculesAir.hotcue2 = function(midino, control, value, status, group) {
	print(['hotcue2',midino, control, value, status, group].join(' '));
	HerculesAir.hotcue(group, 2, value)
}

HerculesAir.hotcue3 = function(midino, control, value, status, group) {
	print(['hotcue3',midino, control, value, status, group].join(' '));
	HerculesAir.hotcue(group, 3, value)
}

HerculesAir.hotcue4 = function(midino, control, value, status, group) {
	print(['hotcue4',midino, control, value, status, group].join(' '));
	HerculesAir.hotcue(group, 4, value)
}

HerculesAir.testLED = function (midino, control, value, status, group) {
	if (value == HerculesAir.buttonReleased) {
		return;
	}
	print(HerculesAir.testLEDnum);
	HerculesAir.sendMidiMsg(HerculesAir.testLEDnum++, HerculesAir.turnOn);
}

// HerculesAir.sampler = function(midino, control, value, status, group) {
// 	if(value != 0x00) {
// 		if(HerculesAir.isShiftButtonPressed) {
// 			engine.setValue(group, "LoadSelectedTrack", 1)
// 		} else if(engine.getValue(group, "play") == 0) {
// 			engine.setValue(group, "start_play", 1)
// 		} else {
// 			engine.setValue(group, "play", 0)
// 		}
// 	}
// }

HerculesAir.scratch = function(midino, control, value, status, group) {
		if (HerculesAir.isShiftButtonPressed && HerculesAir.isDeckStopped(group)) {
				var new_position = engine.getValue(group,"playposition") + 0.008 * HerculesAir.getWhellMovementDirection(value)
				if(new_position < 0) new_position = 0
				if(new_position > 1) new_position = 1
				engine.setValue(group,"playposition",new_position);
		} else {
			engine.scratchTick(HerculesAir.getChannelNumFromGroup(group), HerculesAir.getWhellMovementDirection(value))
		}
}

HerculesAir.scratch_enable = function(midino, control, value, status, group) {
		var scratchEnable_alpha = 1.0 / 8
		var scratchEnable_beta = scratchEnable_alpha / 32
		var scratchEnable_intervalsPerRev = 128
		var scratchEnable_rpm = 33 + 1/3

    if(value == HerculesAir.turnOn) {
        engine.scratchEnable(
					HerculesAir.getChannelNumFromGroup(group),
        	scratchEnable_intervalsPerRev,
        	scratchEnable_rpm,
        	scratchEnable_alpha,
        	scratchEnable_beta
    	)
    } else {
        engine.scratchDisable(
					HerculesAir.getChannelNumFromGroup(group)
    	)
    }
}

HerculesAir.shift = function(midino, control, value, status, group) {
	HerculesAir.isShiftButtonPressed = (value == HerculesAir.turnOn)
}

HerculesAir.isDeckStopped = function(group) {
	return engine.getValue(group, "play") == 0
}

HerculesAir.getChannelNumFromGroup = function(group) {
	return group == "[Channel1]" ? 1 : 2
}

HerculesAir.getWhellMovementDirection = function(value) {
	return value == 0x01 ? 1 : -1
}

HerculesAir.sendMidiMsg = function(control, value) {
	midi.sendShortMsg(HerculesAir.midiMaster, control, value)
}
